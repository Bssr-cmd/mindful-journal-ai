import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  entryTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  entryTitle,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="delete-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isDeleting && onCancel()}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Delete Reflection
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 sm:px-6 py-2">
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Reflection to delete:
            </span>
            <p className="text-sm sm:text-base font-semibold text-stone-900 line-clamp-2">
              "{entryTitle || 'Untitled Reflection'}"
            </p>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
            All written thoughts, dialogue messages, and generated intelligence insights will be permanently deleted from Cloud Firestore.
          </p>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-5 sm:p-6 pt-4 flex items-center justify-end gap-3 bg-stone-50/50 border-t border-stone-100 mt-4">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60 active:scale-98"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Reflection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
