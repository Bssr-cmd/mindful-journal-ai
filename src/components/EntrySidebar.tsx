import React, { useState } from 'react';
import { Plus, Search, Calendar, MessageSquare, Trash2, Smile, Frown, Meh, X } from 'lucide-react';
import type { JournalEntry } from '../types';

interface EntrySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (id: string) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string, title?: string, e?: React.MouseEvent) => void;
}

export const EntrySidebar: React.FC<EntrySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = (entry.title || '').toLowerCase().includes(query);
    const contentMatch = entry.messages.some((m) => m.content.toLowerCase().includes(query));
    return titleMatch || contentMatch;
  });

  const formatEntryDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const getMoodIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 4) return <Smile className="w-3.5 h-3.5 text-emerald-600" />;
    if (score <= 2) return <Frown className="w-3.5 h-3.5 text-rose-500" />;
    return <Meh className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <aside id="entry-sidebar" className="w-full md:w-72 lg:w-80 bg-white border-r border-stone-200 flex flex-col h-full shrink-0 select-none min-h-0">
      {/* Header & Main Action */}
      <div className="p-4 border-b border-stone-200/90 space-y-3 bg-stone-50/60 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Reflections</span>
            <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-semibold">
              {entries.length}
            </span>
          </div>
        </div>

        {/* Primary Action: New Reflection */}
        <button
          id="btn-new-reflection"
          onClick={onNewEntry}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Reflection</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-entries"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
        {filteredEntries.length === 0 ? (
          <div className="py-10 px-4 text-center text-stone-400 space-y-2">
            <MessageSquare className="w-7 h-7 mx-auto text-stone-300" />
            <p className="text-sm font-medium text-stone-700">
              {searchQuery ? 'No matching reflections' : 'No reflections yet'}
            </p>
            <p className="text-xs text-stone-500">
              {searchQuery ? 'Try clearing your search term.' : 'Click "New Reflection" to write.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => onSelectEntry(entry.id)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-stone-100/90 border-stone-300 shadow-2xs'
                    : 'bg-white border-stone-100 hover:bg-stone-50 hover:border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-sm font-medium line-clamp-1 flex-1 leading-snug ${
                      isSelected ? 'text-stone-900 font-semibold' : 'text-stone-800'
                    }`}
                  >
                    {entry.title || 'Untitled Reflection'}
                  </h3>
                  <button
                    id={`btn-delete-entry-${entry.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(entry.id, entry.title || 'Untitled Reflection', e);
                    }}
                    title="Delete reflection"
                    className="opacity-70 md:opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {formatEntryDate(entry.createdAt)}
                  </span>
                  <span>•</span>
                  <span>{entry.messages.length} msg</span>
                </div>

                {/* Reflection Intelligence summary tags */}
                {entry.intelligence && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-200/80 text-stone-700 rounded-md text-xs font-medium truncate max-w-[140px]">
                      {getMoodIcon(entry.intelligence.moodScore)}
                      <span className="truncate">{entry.intelligence.moodTone}</span>
                    </span>
                    {entry.intelligence.actionItems?.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200/80 text-amber-800 rounded-md text-xs font-medium">
                        {entry.intelligence.actionItems.length} actions
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
