import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface WeeklyDashboardProps {
  entries: JournalEntry[];
  onGenerateWeeklySynthesis: () => Promise<string | null>;
  isGeneratingSynthesis: boolean;
  weeklySynthesisText: string | null;
  onOpenEntry: (id: string) => void;
}

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
  entries,
  onGenerateWeeklySynthesis,
  isGeneratingSynthesis,
  weeklySynthesisText,
  onOpenEntry,
}) => {
  const [synthesisOutput, setSynthesisOutput] = useState<string | null>(weeklySynthesisText);

  // Filter entries within the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pastWeekEntries = entries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);

  // Compute metrics
  const totalEntries = pastWeekEntries.length;
  const entriesWithMood = pastWeekEntries.filter((e) => e.intelligence?.moodScore);
  const averageMood =
    entriesWithMood.length > 0
      ? (
          entriesWithMood.reduce((acc, curr) => acc + (curr.intelligence?.moodScore || 3), 0) /
          entriesWithMood.length
        ).toFixed(1)
      : 'N/A';

  const allWeeklyActions = pastWeekEntries.flatMap((e) => e.intelligence?.actionItems || []);

  const handleGenerate = async () => {
    const result = await onGenerateWeeklySynthesis();
    if (result) {
      setSynthesisOutput(result);
    }
  };

  return (
    <div id="weekly-dashboard" className="flex-1 overflow-y-auto bg-stone-100/70 p-4 sm:p-6 lg:p-8 space-y-6 min-h-0">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">Weekly Intelligence</h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">
              Past 7 Days
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Holistic review of patterns, emotional shifts, and actionable steps across your reflections.
          </p>
        </div>

        {/* Main Action */}
        <button
          id="btn-generate-weekly-synthesis"
          onClick={handleGenerate}
          disabled={isGeneratingSynthesis || pastWeekEntries.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-98 shrink-0"
        >
          {isGeneratingSynthesis ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing Week...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate Weekly AI Synthesis</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs sm:text-sm font-semibold text-stone-600">Reflections Logged</span>
              <BookOpen className="w-5 h-5 text-stone-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-stone-900">{totalEntries}</div>
            <p className="text-xs text-stone-400 mt-1">entries created this week</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs sm:text-sm font-semibold text-stone-600">Average Mood</span>
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-stone-900 flex items-center gap-2">
              <span>{averageMood}</span>
              <span className="text-sm font-normal text-stone-400">/ 5.0</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">from Reflection Intelligence</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs sm:text-sm font-semibold text-stone-600">Actions Identified</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-stone-900">{allWeeklyActions.length}</div>
            <p className="text-xs text-stone-400 mt-1">actionable next steps to execute</p>
          </div>
        </div>

        {/* AI Weekly Synthesis Section */}
        {synthesisOutput && (
          <div id="weekly-synthesis-card" className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Gemini Weekly Synthesis</h2>
                <p className="text-xs text-stone-400">Holistic reflection on your emotional and cognitive trajectory</p>
              </div>
            </div>

            <div className="prose prose-stone prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:text-stone-900 prose-headings:my-3 prose-p:my-2 prose-p:leading-relaxed">
              <Markdown>{synthesisOutput}</Markdown>
            </div>
          </div>
        )}

        {/* Weekly Entries & Action Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Entries */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-600">
                Entries This Week ({pastWeekEntries.length})
              </h3>
            </div>
            {pastWeekEntries.length === 0 ? (
              <div className="py-8 text-center text-stone-400 space-y-1.5">
                <p className="text-sm font-medium text-stone-600">No reflections in the last 7 days</p>
                <p className="text-xs text-stone-400">Write reflections to see them summarized here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastWeekEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onOpenEntry(entry.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition-all cursor-pointer text-xs sm:text-sm group"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="font-semibold text-stone-900 truncate group-hover:text-stone-700">
                        {entry.title || 'Untitled Reflection'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1">
                        {new Date(entry.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {entry.messages.length} msg
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.intelligence?.moodTone && (
                        <span className="px-2 py-0.5 bg-stone-200/80 text-stone-700 rounded-md text-xs font-medium truncate max-w-[120px]">
                          {entry.intelligence.moodTone}
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consolidated Action Items */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-600">
              Extracted Action Steps ({allWeeklyActions.length})
            </h3>
            {allWeeklyActions.length === 0 ? (
              <div className="py-8 text-center text-stone-400 space-y-1.5">
                <p className="text-sm font-medium text-stone-600">No action items extracted yet</p>
                <p className="text-xs text-stone-400">
                  Run "Generate Reflection Intelligence" on daily entries to extract action items.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {allWeeklyActions.map((action, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 text-xs sm:text-sm text-stone-800 border border-stone-200/70 leading-relaxed"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
