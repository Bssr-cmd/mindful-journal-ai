import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  User,
  Bot,
  AlertCircle,
  Lightbulb,
  Compass,
  FileText,
  Clock,
  Check,
  PanelRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { JournalEntry, ReflectionMode } from '../types';

interface ReflectionEditorProps {
  entry: JournalEntry;
  onUpdateTitle: (newTitle: string) => void;
  onSendMessage: (content: string, mode: ReflectionMode) => Promise<boolean>;
  onTriggerAnalysis: () => void;
  onDeleteEntry: () => void;
  isSending: boolean;
  isAnalyzing: boolean;
  error: string | null;
  onClearError: () => void;
  showIntelligencePanel: boolean;
  onToggleIntelligencePanel: () => void;
}

const INSPIRATION_PROMPTS = [
  'A dilemma or decision I am weighing right now...',
  'What brought me energy or drained my focus today?',
  'A realization from a challenging moment this week...',
];

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  entry,
  onUpdateTitle,
  onSendMessage,
  onTriggerAnalysis,
  onDeleteEntry,
  isSending,
  isAnalyzing,
  error,
  onClearError,
  showIntelligencePanel,
  onToggleIntelligencePanel,
}) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflect');
  const [title, setTitle] = useState(entry.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(entry.title || '');
  }, [entry.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isSending]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== entry.title) {
      onUpdateTitle(title.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    // Call send message handler. Only clear input if confirmed successful!
    const success = await onSendMessage(trimmed, mode);
    if (success) {
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const formattedCreated = new Date(entry.createdAt).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div id="reflection-editor" className="flex-1 flex flex-col h-full bg-white relative overflow-hidden min-w-0 min-h-0">
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 shrink-0">
        <div className="flex-1 mr-3 min-w-0">
          {isEditingTitle ? (
            <input
              id="input-entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="text-lg sm:text-2xl font-serif font-bold text-stone-900 border-b border-stone-400 bg-transparent focus:outline-hidden w-full"
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
              className="flex items-center gap-2 cursor-pointer group max-w-xl"
            >
              <h1 className="text-lg sm:text-2xl font-serif font-bold text-stone-900 group-hover:text-stone-700 transition-colors truncate">
                {entry.title || 'Untitled Reflection'}
              </h1>
              <Edit2 className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-500 mt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{formattedCreated}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" /> Firestore Synced
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-analyze-entry"
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing || entry.messages.length === 0}
            title={entry.messages.length === 0 ? 'Write a reflection first to analyze' : 'Extract reflection intelligence'}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <Sparkles className={`w-4 h-4 text-amber-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Generate Reflection Intelligence'}</span>
            <span className="sm:hidden">{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>

          <button
            onClick={onToggleIntelligencePanel}
            title={showIntelligencePanel ? 'Hide Intelligence Panel' : 'Show Intelligence Panel'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showIntelligencePanel
                ? 'bg-stone-200 text-stone-900 border-stone-300'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <PanelRight className="w-4 h-4" />
          </button>

          <button
            id="btn-delete-active-entry"
            onClick={onDeleteEntry}
            title="Delete this reflection"
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          id="editor-error-banner"
          className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between text-xs sm:text-sm text-rose-800 shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-600 hover:text-rose-900 font-semibold cursor-pointer ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Conversation / Reflection Thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 min-h-0">
        <div className="max-w-3xl mx-auto w-full space-y-5">
          {entry.messages.length === 0 ? (
            <div className="my-8 sm:my-16 text-center space-y-5 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  What is on your mind today?
                </h2>
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md mx-auto">
                  Write freely about an experience, decision, realization, or question. Gemini will read thoughtfully and reflect back constructive insights.
                </p>
              </div>

              {/* Inspiration starter chips */}
              <div className="pt-3 space-y-2.5">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Inspiration Prompts
                </p>
                <div className="flex flex-col gap-2 items-center">
                  {INSPIRATION_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(prompt)}
                      className="text-sm text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 rounded-full px-4 py-2 transition-all cursor-pointer text-left shadow-2xs hover:border-stone-300"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            entry.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shrink-0 shadow-2xs mt-1">
                      <Bot className="w-4 h-4 text-amber-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-tr-xs shadow-2xs'
                        : 'bg-stone-50 text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-stone-100">{msg.content}</div>
                    ) : (
                      <div className="prose prose-stone prose-sm sm:prose-base max-w-none prose-p:my-2 prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-stone-900 prose-headings:my-2.5 prose-ul:my-2 prose-li:my-0.5">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    <div
                      className={`text-xs mt-2 flex items-center gap-1 ${
                        isUser ? 'text-stone-400 justify-end' : 'text-stone-400 justify-start'
                      }`}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shrink-0 shadow-2xs mt-1">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-stone-50 border border-stone-200/90 rounded-2xl rounded-tl-xs p-4 flex items-center gap-2.5 text-sm text-stone-600">
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-sm font-medium">Gemini is reflecting on your thoughts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mode Selector & Input Footer */}
      <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 shrink-0">
        <div className="max-w-3xl mx-auto w-full space-y-3">
          {/* Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:inline">Focus Mode:</span>
              <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-xl">
                <button
                  onClick={() => setMode('reflect')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    mode === 'reflect'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Deep Reflection</span>
                </button>
                <button
                  onClick={() => setMode('brainstorm')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    mode === 'brainstorm'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Brainstorm</span>
                </button>
                <button
                  onClick={() => setMode('summarize')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    mode === 'summarize'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Synthesis</span>
                </button>
              </div>
            </div>

            <span className="text-xs text-stone-400 hidden sm:inline">
              {inputText.length > 0 ? `${inputText.length} / 10,000` : 'Cmd/Ctrl + Enter to Reflect'}
            </span>
          </div>

          {/* Input Box */}
          <div className="relative bg-white rounded-2xl border border-stone-300 focus-within:border-stone-500 focus-within:ring-2 focus-within:ring-stone-400/20 shadow-xs transition-all">
            <textarea
              id="textarea-reflection-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What thoughts, feelings, or questions are you sitting with? (Cmd + Enter to Reflect)"
              rows={3}
              maxLength={10000}
              className="w-full px-4 py-3 text-sm sm:text-base text-stone-900 placeholder-stone-400 bg-transparent resize-none focus:outline-hidden leading-relaxed"
            />

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-100 bg-stone-50/50 rounded-b-2xl">
              <span className="text-xs text-stone-400 sm:hidden">
                {inputText.length} / 10,000
              </span>
              <div className="hidden sm:block">
                <span className="text-xs text-stone-400">Press Cmd/Ctrl + Enter to send</span>
              </div>

              {/* Main Action: Reflect */}
              <button
                id="btn-send-reflection"
                onClick={() => handleSend()}
                disabled={isSending || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>Reflect</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
