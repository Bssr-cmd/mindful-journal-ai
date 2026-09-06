import React from 'react';
import { Sparkles, BookOpen, BarChart3, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'journal' | 'weekly';
  onTabChange: (tab: 'journal' | 'weekly') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onSignOut,
}) => {
  return (
    <header id="app-navbar" className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 transition-all shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-stone-900 tracking-tight text-lg sm:text-xl">Mindful Journal</span>
              <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Isolated
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs (when signed in) */}
        {user && (
          <nav className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80">
            <button
              id="tab-journal"
              onClick={() => onTabChange('journal')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Journal & Reflections</span>
              <span className="sm:hidden">Journal</span>
            </button>
            <button
              id="tab-weekly"
              onClick={() => onTabChange('weekly')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'weekly'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Weekly Intelligence</span>
            </button>
          </nav>
        )}

        {/* User Identity & Sign Out */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="hidden xl:inline text-sm font-medium text-stone-800 max-w-[120px] truncate">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
              </div>
              <button
                id="btn-sign-out"
                onClick={onSignOut}
                title="Sign out of application"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <span className="text-sm text-stone-500 font-medium">Secured Session</span>
          )}
        </div>
      </div>
    </header>
  );
};
