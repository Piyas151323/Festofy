import React, { useState, useEffect, useRef } from 'react';
import { Tag, X, AlertCircle, Loader2, Sparkles, Check } from 'lucide-react';
import { EventCategory } from '../../types';
import { createCustomCategory } from '../../services/eventService';

export interface AddCustomCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: EventCategory) => void;
  existingCategories: EventCategory[];
}

export const AddCustomCategoryModal: React.FC<AddCustomCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  existingCategories
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('Custom Categories');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setGroup('Custom Categories');
      setError(null);
      setIsSaving(false);
      setIsSuccess(false);

      // Focus input after modal renders
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSaving) {
          onClose();
        }
      };

      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setError(null);
    const trimmed = name.trim();

    // 1. Validation checks
    if (!trimmed) {
      setError('Custom category name cannot be empty.');
      inputRef.current?.focus();
      return;
    }

    if (trimmed.length < 2) {
      setError('Category name must be at least 2 characters long.');
      inputRef.current?.focus();
      return;
    }

    if (trimmed.length > 80) {
      setError('Category name cannot exceed 80 characters.');
      inputRef.current?.focus();
      return;
    }

    // 2. Case-insensitive duplicate check
    const normalized = trimmed.toLowerCase();
    const duplicate = existingCategories.find(
      c => c.name.toLowerCase() === normalized ||
           (c.normalizedName && c.normalizedName.toLowerCase() === normalized)
    );

    if (duplicate) {
      setError(`A category named "${duplicate.name}" already exists.`);
      inputRef.current?.focus();
      return;
    }

    // 3. Persist to Firestore
    try {
      setIsSaving(true);
      const newCategory = await createCustomCategory(trimmed, description, group);
      setIsSuccess(true);
      
      setTimeout(() => {
        onCategoryCreated(newCategory);
      }, 350);
    } catch (err: any) {
      console.error('Error creating custom category:', err);
      setError(err?.message || 'Failed to save custom category. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-category-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#14161a] border border-[#242730] rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-page-enter"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#242730]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ff4f1a]/10 border border-[#ff4f1a]/30 flex items-center justify-center text-[#ff4f1a]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#ff4f1a] uppercase tracking-wider font-semibold">
                  Taxonomy Extension
                </span>
              </div>
              <h3 id="custom-category-title" className="text-base font-bold text-white font-heading">
                Add Custom Category
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f2229] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Error Message Alert */}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Indicator */}
          {isSuccess && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-200"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Category saved! Selecting in event form...</span>
            </div>
          )}

          {/* Input: Category Name */}
          <div>
            <label
              htmlFor="custom-category-name-input"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Custom Category Name <span className="text-[#ff4f1a]">*</span>
            </label>
            <input
              ref={inputRef}
              id="custom-category-name-input"
              type="text"
              required
              disabled={isSaving || isSuccess}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Quantum Computing, AI Artistry, Drone Racing"
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a] transition-colors"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
              <span>Must be 2–80 characters and unique.</span>
              <span>{name.trim().length}/80</span>
            </div>
          </div>

          {/* Optional Group Selection */}
          <div>
            <label
              htmlFor="custom-category-group-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Category Group <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <select
              id="custom-category-group-select"
              value={group}
              disabled={isSaving || isSuccess}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a] transition-colors cursor-pointer"
            >
              <option value="Custom Categories">Custom Categories</option>
              <option value="Technology & Computing">Technology & Computing</option>
              <option value="Academic & Innovation">Academic & Innovation</option>
              <option value="Creative & Media">Creative & Media</option>
              <option value="Competitions & General Events">Competitions & General Events</option>
            </select>
          </div>

          {/* Optional Description */}
          <div>
            <label
              htmlFor="custom-category-desc-input"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Description <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="custom-category-desc-input"
              rows={2}
              disabled={isSaving || isSuccess}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what kinds of challenges or workshops belong here..."
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a] transition-colors"
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#242730]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isSuccess || !name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#ff4f1a]/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
