import React from 'react';
import { Sparkles, Shield, Lock, Brain, Calendar, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  authError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  authError,
}) => {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  return (
    <div id="landing-page" className="flex-1 overflow-y-auto flex flex-col justify-between bg-stone-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 min-h-0">
      <div className="max-w-4xl mx-auto w-full text-center space-y-7 sm:space-y-8 my-auto">
        {/* Hero Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Private AI Journaling & Cognitive Reflection</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3.5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
            A sanctuary for your thoughts, reflected by intelligent insights.
          </h1>
          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Write unhurried daily reflections and converse in multi-turn depth with Gemini.
            All interactions are cryptographically isolated to your Google account in Cloud Firestore.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            id="btn-google-sign-in"
            onClick={onSignIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 px-7 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer text-sm sm:text-base"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </button>

          {authError && (
            <div id="auth-error-banner" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl max-w-md">
              {authError}
            </div>
          )}

          {isInIframe && (
            <a
              id="link-open-new-tab"
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2 transition-colors mt-1"
            >
              <span>If popup is blocked in preview, open app in a new tab</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>
          )}

          <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            No password required. Passwords are never stored in application code.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-left">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-300 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-900 mb-3.5">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1.5">User Data Isolation</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Every reflection is stored strictly under your Google UID in Cloud Firestore. Deny-by-default rules prevent cross-user access.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-300 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-900 mb-3.5">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1.5">Gemini 3.6 Flash Intelligence</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Converse in multi-turn depth. Uncover key thoughts, emotional tone, action items, and provocative inquiry prompts.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-300 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-900 mb-3.5">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1.5">Weekly Intelligence</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Review 7-day trajectories, aggregate mood shifts, consolidate actionable next steps, and generate AI synthesis.
            </p>
          </div>
        </div>

        {/* How It Works Checklist */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 text-left max-w-2xl mx-auto space-y-2.5 shadow-2xs">
          <p className="text-xs font-bold text-stone-700 tracking-wider uppercase">Core Architecture & Flow</p>
          <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Authentication via Firebase provides cryptographically signed ID tokens.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Backend Express routes verify token validity and derive user identity safely.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Secrets are injected via Google Cloud Secret Manager, never exposed in client bundles.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Automated fallback ladder ensures high availability across verified Gemini models.</span>
            </li>
          </ul>
        </div>
      </div>

      <footer className="text-center text-xs sm:text-sm text-stone-400 pt-8 pb-2">
        Built with Google AI Studio • Cloud Run • Cloud Firestore • Gemini 3.6 Flash
      </footer>
    </div>
  );
};
