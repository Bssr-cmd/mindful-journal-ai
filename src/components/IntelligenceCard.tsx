import React from 'react';
import {
  Sparkles,
  Brain,
  CheckSquare,
  Square,
  HelpCircle,
  Activity,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { ReflectionIntelligence } from '../types';

interface IntelligenceCardProps {
  intelligence?: ReflectionIntelligence;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onToggleActionItem?: (index: number) => void;
  completedActions?: number[];
  sidebarWidth?: number;
  onSetSidebarWidth?: (width: number) => void;
}

export const IntelligenceCard: React.FC<IntelligenceCardProps> = ({
  intelligence,
  isAnalyzing,
  onAnalyze,
  onToggleActionItem,
  completedActions = [],
  sidebarWidth,
  onSetSidebarWidth,
}) => {
  const isExpanded = (sidebarWidth ?? 440) >= 560;

  const toggleExpand = () => {
    if (!onSetSidebarWidth) return;
    if (isExpanded) {
      onSetSidebarWidth(440);
    } else {
      onSetSidebarWidth(580);
    }
  };

  const renderWidthPresets = () => {
    if (!onSetSidebarWidth) return null;
    return (
      <div className="hidden lg:flex items-center justify-between gap-1 pt-1 pb-2 border-b border-stone-100 text-xs text-stone-500">
        <span className="text-[11px] font-medium text-stone-400">Panel Width:</span>
        <div className="flex items-center gap-1 bg-stone-100/90 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onSetSidebarWidth(360)}
            title="Compact width (360px)"
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              (sidebarWidth ?? 440) < 400
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Compact
          </button>
          <button
            type="button"
            onClick={() => onSetSidebarWidth(440)}
            title="Standard width (440px)"
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              (sidebarWidth ?? 440) >= 400 && (sidebarWidth ?? 440) < 520
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onSetSidebarWidth(580)}
            title="Wide width (580px)"
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              (sidebarWidth ?? 440) >= 520 && (sidebarWidth ?? 440) < 650
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Wide
          </button>
          <button
            type="button"
            onClick={() => onSetSidebarWidth(680)}
            title="Expanded width (680px)"
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              (sidebarWidth ?? 440) >= 650
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            XL
          </button>
        </div>
      </div>
    );
  };

  if (!intelligence) {
    return (
      <div id="intelligence-placeholder" className="bg-white border border-stone-200/90 rounded-2xl p-5 text-center space-y-3.5 shadow-2xs">
        {renderWidthPresets()}
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
          <Brain className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-stone-900">Reflection Intelligence</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
            Extract emotional tone, synthesis, action items, and follow-up prompts from this reflection.
          </p>
        </div>
        <button
          id="btn-trigger-analysis"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Reflection...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate Reflection Intelligence</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const { moodTone, moodScore, keyThoughts, actionItems, reflectionQuestion, summary } = intelligence;
  const scorePercentage = Math.min(Math.max((moodScore / 5) * 100, 20), 100);

  return (
    <div id="intelligence-card" className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Width Presets */}
      {renderWidthPresets()}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Reflection Intelligence</h3>
            <p className="text-xs text-stone-400">Gemini 3.6 Flash</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onSetSidebarWidth && (
            <button
              onClick={toggleExpand}
              title={isExpanded ? 'Collapse panel width (440px)' : 'Expand panel width (580px)'}
              className="hidden lg:flex items-center justify-center w-7 h-7 text-stone-500 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            title="Re-analyze with latest messages"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? '...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Mood & Tone Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-stone-600 flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Mood Tone
          </span>
          <span className="font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md text-xs">
            {moodTone} ({moodScore}/5)
          </span>
        </div>
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-rose-400 via-amber-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <span className="font-bold text-stone-900 block mb-1 text-xs uppercase tracking-wider">Core Synthesis:</span>
          {summary}
        </div>
      )}

      {/* Key Thoughts */}
      {keyThoughts && keyThoughts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Key Thoughts</p>
          <ul className="space-y-1.5">
            {keyThoughts.map((thought, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{thought}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {actionItems && actionItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Action Items ({actionItems.length})
          </p>
          <div className="space-y-1.5">
            {actionItems.map((action, idx) => {
              const isDone = completedActions.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => onToggleActionItem && onToggleActionItem(idx)}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200/70 cursor-pointer transition-colors text-xs sm:text-sm"
                >
                  {isDone ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  )}
                  <span className={`leading-relaxed ${isDone ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                    {action}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reflection Question */}
      {reflectionQuestion && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Follow-Up Inquiry</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-800 italic leading-relaxed">
            "{reflectionQuestion}"
          </p>
        </div>
      )}
    </div>
  );
};
