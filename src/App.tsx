import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOut, onAuthStateChanged, type User } from './firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { EntrySidebar } from './components/EntrySidebar';
import { ReflectionEditor } from './components/ReflectionEditor';
import { IntelligenceCard } from './components/IntelligenceCard';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { sanitizeFirestorePayload } from './utils/sanitize';
import type { JournalEntry, Message, ReflectionMode, UserProfile, ReflectionIntelligence } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'journal' | 'weekly'>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [weeklySynthesisText, setWeeklySynthesisText] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showIntelligencePanel, setShowIntelligencePanel] = useState(true);
  const [completedActionMap, setCompletedActionMap] = useState<Record<string, number[]>>({});

  // Adjustable Intelligence Sidebar width (persisted in localStorage)
  const [intelligenceWidth, setIntelligenceWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('intelligence_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 750) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 440; // Default wide width
  });

  const isDraggingSidebarRef = useRef(false);

  const handleSetIntelligenceWidth = (width: number) => {
    const clamped = Math.min(Math.max(width, 320), 750);
    setIntelligenceWidth(clamped);
    try {
      localStorage.setItem('intelligence_sidebar_width', clamped.toString());
    } catch {
      // ignore
    }
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSidebarRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingSidebarRef.current) return;
      const newWidth = window.innerWidth - moveEvent.clientX;
      const clamped = Math.min(Math.max(newWidth, 320), Math.min(750, window.innerWidth * 0.55));
      handleSetIntelligenceWidth(clamped);
    };

    const handleMouseUp = () => {
      isDraggingSidebarRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Safe In-App Delete Confirmation State
  const [entryPendingDelete, setEntryPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRequestDelete = (id: string, title?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEntryPendingDelete({ id, title: title || 'Untitled Reflection' });
  };

  const handleConfirmDelete = async () => {
    if (!currentUser || !entryPendingDelete) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'users', currentUser.uid, 'entries', entryPendingDelete.id));
      if (selectedEntryId === entryPendingDelete.id) {
        const remaining = entries.filter((item) => item.id !== entryPendingDelete.id);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
      setEntryPendingDelete(null);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setErrorMessage('Could not delete reflection from Firestore. Please check your network or permissions.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setEntryPendingDelete(null);
  };

  // 1. Listen to Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
      if (!user) {
        setEntries([]);
        setSelectedEntryId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time subscription to User's private entries in Cloud Firestore
  // Path: /users/{userId}/entries/{entryId}
  useEffect(() => {
    if (!currentUser) return;

    const entriesColRef = collection(db, 'users', currentUser.uid, 'entries');
    const entriesQuery = query(entriesColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const loaded: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId || currentUser.uid,
            title: data.title || 'Untitled Reflection',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            messages: Array.isArray(data.messages) ? data.messages : [],
            intelligence: data.intelligence || undefined,
            tags: Array.isArray(data.tags) ? data.tags : [],
            wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0,
          });
        });

        setEntries(loaded);

        // If no entry is currently selected, select the latest one or leave null
        setSelectedEntryId((prev) => {
          if (prev && loaded.some((e) => e.id === prev)) {
            return prev;
          }
          return loaded.length > 0 ? loaded[0].id : null;
        });
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err);
        // Fallback without orderBy if composite index is required
        getDocs(entriesColRef)
          .then((snapshot) => {
            const fallbackLoaded: JournalEntry[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              fallbackLoaded.push({
                id: docSnap.id,
                userId: data.userId || currentUser.uid,
                title: data.title || 'Untitled Reflection',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                messages: Array.isArray(data.messages) ? data.messages : [],
                intelligence: data.intelligence || undefined,
                tags: Array.isArray(data.tags) ? data.tags : [],
                wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0,
              });
            });
            fallbackLoaded.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setEntries(fallbackLoaded);
          })
          .catch((fetchErr) => {
            console.error('Failed to query user entries:', fetchErr);
            setErrorMessage('Unable to load entries from Firestore. Please check your connection.');
          });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Auth Handlers
  const handleSignIn = async () => {
    try {
      setAuthError(null);
      const user = await signInWithGoogle();
      if (!user) {
        // User voluntarily dismissed or cancelled the popup window. No error state.
        return;
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        // User closed or dismissed popup, safe return without error
        return;
      }
      if (code === 'auth/popup-blocked') {
        setAuthError('The sign-in popup was blocked by your browser. Please allow popups or open this app in a new tab.');
        return;
      }
      console.error('Sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Google authentication failed.';
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Create New Journal Entry
  const handleNewEntry = useCallback(async () => {
    if (!currentUser) return;
    try {
      setErrorMessage(null);
      const newId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const newEntry: JournalEntry = {
        id: newId,
        userId: currentUser.uid,
        title: 'New Reflection',
        createdAt: now,
        updatedAt: now,
        messages: [],
        tags: [],
        wordCount: 0,
      };

      // Strict undefined stripping before save
      const cleanPayload = sanitizeFirestorePayload(newEntry);
      await setDoc(doc(db, 'users', currentUser.uid, 'entries', newId), cleanPayload);

      setSelectedEntryId(newId);
      setActiveTab('journal');
    } catch (err) {
      console.error('Failed to create new reflection entry:', err);
      setErrorMessage('Could not save new entry to Firestore. Please retry.');
    }
  }, [currentUser]);

  // Update Title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!currentUser || !selectedEntryId) return;
    const active = entries.find((e) => e.id === selectedEntryId);
    if (!active) return;

    try {
      const updated: JournalEntry = {
        ...active,
        title: newTitle,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(
        doc(db, 'users', currentUser.uid, 'entries', selectedEntryId),
        sanitizeFirestorePayload(updated)
      );
    } catch (err) {
      console.error('Failed to update entry title:', err);
      setErrorMessage('Failed to update title.');
    }
  };

  // Send Reflection Message (Multi-turn dialogue with Gemini)
  const handleSendMessage = async (
    content: string,
    mode: ReflectionMode
  ): Promise<boolean> => {
    if (!currentUser || !selectedEntryId) {
      setErrorMessage('Please select or create an entry first.');
      return false;
    }

    const active = entries.find((e) => e.id === selectedEntryId);
    if (!active) {
      setErrorMessage('Active entry not found.');
      return false;
    }

    setIsSending(true);
    setErrorMessage(null);

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...active.messages, userMessage];

    try {
      // Step 1: Persist user's reflection to Firestore first (guarantee input persistence)
      const intermediateEntry: JournalEntry = {
        ...active,
        messages: newMessages,
        updatedAt: new Date().toISOString(),
        wordCount: newMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0),
      };

      await setDoc(
        doc(db, 'users', currentUser.uid, 'entries', selectedEntryId),
        sanitizeFirestorePayload(intermediateEntry)
      );

      // Step 2: Acquire Firebase ID token
      const idToken = await currentUser.getIdToken();

      // Step 3: Call server API proxy (GEMINI_API_KEY kept safe on server)
      const res = await fetch('/api/reflections/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          mode,
          entryTitle: active.title,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const modelReply = data.reply || 'I am listening deeply. Please share more.';

      const geminiMessage: Message = {
        id: `msg_${Date.now()}_model`,
        role: 'model',
        content: modelReply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, geminiMessage];

      // Auto-generate title if this is the first reflection and still untitled
      let updatedTitle = active.title;
      if (active.title === 'New Reflection' || active.title === 'Untitled Reflection') {
        const snippet = content.slice(0, 45).trim();
        updatedTitle = snippet ? `${snippet}...` : active.title;
      }

      // Step 4: Persist Gemini's response to Firestore
      const finalEntry: JournalEntry = {
        ...active,
        title: updatedTitle,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
        wordCount: finalMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0),
      };

      await setDoc(
        doc(db, 'users', currentUser.uid, 'entries', selectedEntryId),
        sanitizeFirestorePayload(finalEntry)
      );

      setIsSending(false);
      return true;
    } catch (err: unknown) {
      console.error('Error during reflection message handling:', err);
      const msg = err instanceof Error ? err.message : 'Failed to communicate with reflection assistant.';
      setErrorMessage(`Reflection could not be completed: ${msg}. Your input has been saved.`);
      setIsSending(false);
      return false;
    }
  };

  // Analyze Reflection Intelligence
  const handleAnalyzeIntelligence = async () => {
    if (!currentUser || !selectedEntryId) return;
    const active = entries.find((e) => e.id === selectedEntryId);
    if (!active || active.messages.length === 0) {
      setErrorMessage('Write at least one reflection before running intelligence analysis.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/reflections/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          messages: active.messages,
          entryTitle: active.title,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Analysis request failed.');
      }

      const data = await res.json();
      const intelligence: ReflectionIntelligence = data.intelligence;

      // Update Firestore document
      const updatedEntry: JournalEntry = {
        ...active,
        intelligence,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, 'users', currentUser.uid, 'entries', selectedEntryId),
        sanitizeFirestorePayload(updatedEntry)
      );

      setShowIntelligencePanel(true);
      setIsAnalyzing(false);
    } catch (err: unknown) {
      console.error('Failed to analyze entry intelligence:', err);
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setErrorMessage(`Intelligence extraction failed: ${msg}`);
      setIsAnalyzing(false);
    }
  };



  // Toggle Action Item Checkbox
  const handleToggleActionItem = (index: number) => {
    if (!selectedEntryId) return;
    setCompletedActionMap((prev) => {
      const currentList = prev[selectedEntryId] || [];
      const updatedList = currentList.includes(index)
        ? currentList.filter((i) => i !== index)
        : [...currentList, index];
      return { ...prev, [selectedEntryId]: updatedList };
    });
  };

  // Generate Weekly AI Review
  const handleGenerateWeeklySynthesis = async (): Promise<string | null> => {
    if (!currentUser) return null;
    setIsGeneratingWeekly(true);
    setErrorMessage(null);

    try {
      const idToken = await currentUser.getIdToken();
      const payloadEntries = entries.map((e) => ({
        title: e.title,
        createdAt: e.createdAt,
        summary: e.intelligence?.summary || e.messages.map((m) => m.content).join(' ').slice(0, 300),
        moodTone: e.intelligence?.moodTone || 'Unspecified',
        keyThoughts: e.intelligence?.keyThoughts || [],
      }));

      const res = await fetch('/api/reflections/weekly-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ entries: payloadEntries }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to synthesize weekly review.');
      }

      const data = await res.json();
      const output = data.synthesis || '';
      setWeeklySynthesisText(output);
      setIsGeneratingWeekly(false);
      return output;
    } catch (err: unknown) {
      console.error('Weekly synthesis failure:', err);
      const msg = err instanceof Error ? err.message : 'Weekly synthesis failed.';
      setErrorMessage(msg);
      setIsGeneratingWeekly(false);
      return null;
    }
  };

  // Format user profile
  const userProfile: UserProfile | null = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      }
    : null;

  const activeEntry = entries.find((e) => e.id === selectedEntryId) || null;
  const [mobileJournalTab, setMobileJournalTab] = useState<'entries' | 'editor' | 'intelligence'>('editor');

  // When entry selection changes, switch to editor on mobile so user sees the entry immediately
  const handleSelectEntryResponsive = (id: string) => {
    setSelectedEntryId(id);
    setMobileJournalTab('editor');
  };

  const handleNewEntryResponsive = async () => {
    await handleNewEntry();
    setMobileJournalTab('editor');
  };

  // Render initial auth loading state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium tracking-wide uppercase">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  // Render Unauthenticated Landing Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
        <Navbar
          user={null}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSignOut={handleSignOut}
        />
        <LandingPage
          onSignIn={handleSignIn}
          isLoading={false}
          authError={authError}
        />
      </div>
    );
  }

  // Render Authenticated Dashboard
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-stone-100 text-stone-900 flex flex-col font-sans">
      <Navbar
        user={userProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {activeTab === 'journal' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
            {/* Mobile Sub-Navigation Bar (visible only on small screens) */}
            <div className="md:hidden flex items-center justify-around bg-white border-b border-stone-200 px-3 py-1.5 shrink-0">
              <button
                onClick={() => setMobileJournalTab('entries')}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium text-center rounded-lg transition-colors cursor-pointer ${
                  mobileJournalTab === 'entries'
                    ? 'bg-stone-100 text-stone-900 font-semibold shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Entries ({entries.length})
              </button>
              <button
                onClick={() => setMobileJournalTab('editor')}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium text-center rounded-lg transition-colors cursor-pointer ${
                  mobileJournalTab === 'editor'
                    ? 'bg-stone-100 text-stone-900 font-semibold shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Journal Editor
              </button>
              <button
                onClick={() => setMobileJournalTab('intelligence')}
                disabled={!activeEntry}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium text-center rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
                  mobileJournalTab === 'intelligence'
                    ? 'bg-stone-100 text-stone-900 font-semibold shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Intelligence
              </button>
            </div>

            {/* Main Multi-Column View */}
            <div className="flex-1 flex flex-row h-full overflow-hidden min-h-0">
              {/* Left Sidebar: Entries list & New Reflection */}
              <div
                className={`${
                  mobileJournalTab === 'entries' ? 'flex' : 'hidden'
                } md:flex h-full shrink-0 min-h-0`}
              >
                <EntrySidebar
                  entries={entries}
                  selectedEntryId={selectedEntryId}
                  onSelectEntry={handleSelectEntryResponsive}
                  onNewEntry={handleNewEntryResponsive}
                  onDeleteEntry={handleRequestDelete}
                />
              </div>

              {/* Center: Journal Editor (Wide & Prominent) */}
              {activeEntry ? (
                <div
                  className={`flex-1 flex flex-col lg:flex-row h-full overflow-hidden min-w-0 min-h-0 ${
                    mobileJournalTab === 'entries' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div
                    className={`flex-1 flex flex-col h-full min-w-0 min-h-0 ${
                      mobileJournalTab === 'intelligence' ? 'hidden lg:flex' : 'flex'
                    }`}
                  >
                    <ReflectionEditor
                      entry={activeEntry}
                      onUpdateTitle={handleUpdateTitle}
                      onSendMessage={handleSendMessage}
                      onTriggerAnalysis={handleAnalyzeIntelligence}
                      onDeleteEntry={() => handleRequestDelete(activeEntry.id, activeEntry.title)}
                      isSending={isSending}
                      isAnalyzing={isAnalyzing}
                      error={errorMessage}
                      onClearError={() => setErrorMessage(null)}
                      showIntelligencePanel={showIntelligencePanel}
                      onToggleIntelligencePanel={() => setShowIntelligencePanel(!showIntelligencePanel)}
                    />
                  </div>

                  {/* Right Side Panel: Reflection Intelligence (Adjustable Width & Draggable) */}
                  {showIntelligencePanel && (
                    <>
                      {/* Draggable Resizer (Desktop) */}
                      <div
                        id="intelligence-sidebar-resizer"
                        onMouseDown={handleMouseDownResize}
                        title="Drag to resize Reflection Intelligence sidebar"
                        className="hidden lg:flex w-2 hover:w-2.5 bg-stone-200/50 hover:bg-amber-400 cursor-col-resize shrink-0 transition-colors items-center justify-center relative group z-10 select-none"
                      >
                        <div className="w-0.5 h-7 bg-stone-400 group-hover:bg-amber-800 rounded-full transition-colors" />
                      </div>

                      <div
                        id="intelligence-sidebar-container"
                        style={{
                          width: mobileJournalTab === 'intelligence' ? '100%' : `${intelligenceWidth}px`,
                        }}
                        className={`bg-stone-50 border-l border-stone-200/90 p-4 sm:p-5 overflow-y-auto shrink-0 min-h-0 min-w-[320px] max-w-[750px] ${
                          mobileJournalTab === 'intelligence'
                            ? 'flex flex-col flex-1 w-full'
                            : 'hidden lg:block'
                        }`}
                      >
                        <IntelligenceCard
                          intelligence={activeEntry.intelligence}
                          isAnalyzing={isAnalyzing}
                          onAnalyze={handleAnalyzeIntelligence}
                          onToggleActionItem={handleToggleActionItem}
                          completedActions={
                            selectedEntryId ? completedActionMap[selectedEntryId] || [] : []
                          }
                          sidebarWidth={intelligenceWidth}
                          onSetSidebarWidth={handleSetIntelligenceWidth}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Polished Empty State */
                <div
                  className={`flex-1 flex items-center justify-center p-6 text-center bg-white min-w-0 min-h-0 ${
                    mobileJournalTab === 'entries' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="max-w-md space-y-5 p-6">
                    <div className="w-14 h-14 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center mx-auto shadow-xs">
                      <svg
                        className="w-7 h-7 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                        Welcome to Your Private Sanctuary
                      </h2>
                      <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-sm mx-auto">
                        Start a fresh reflection or select an existing entry to dialogue with Gemini, synthesize ideas, and uncover clarity.
                      </p>
                    </div>
                    <button
                      id="btn-empty-new-reflection"
                      onClick={handleNewEntryResponsive}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold shadow-xs cursor-pointer transition-all active:scale-98"
                    >
                      <span>New Reflection</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Weekly Reflection Dashboard View */
          <WeeklyDashboard
            entries={entries}
            onGenerateWeeklySynthesis={handleGenerateWeeklySynthesis}
            isGeneratingSynthesis={isGeneratingWeekly}
            weeklySynthesisText={weeklySynthesisText}
            onOpenEntry={(id) => {
              setSelectedEntryId(id);
              setActiveTab('journal');
              setMobileJournalTab('editor');
            }}
          />
        )}
      </main>

      {/* In-App Safe Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={entryPendingDelete !== null}
        entryTitle={entryPendingDelete?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
