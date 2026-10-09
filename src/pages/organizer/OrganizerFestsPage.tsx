import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle2,
  Archive,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getOrganizationFests,
  publishFest,
  completeFest,
  archiveFest,
  deleteDraftFest
} from '../../services/festService';
import { Fest, FestStatus } from '../../types';
import { formatDateTime, formatDateRange } from '../../utils/dateUtils';
import { ConfirmDialog, useToast } from '../../components/ui';

type SortOption = 'updated_desc' | 'start_asc' | 'start_desc' | 'name_asc';

export const OrganizerFestsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();

  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FestStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');

  const loadFests = useCallback(async () => {
    if (!activeOrganization) {
      setFests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getOrganizationFests(activeOrganization.id);
      setFests(data || []);
    } catch (err: any) {
      console.warn('Notice loading organization fests:', err?.message || err);
      setErrorMsg(err.message || 'Unable to retrieve festivals for this organization.');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    if (!orgLoading) {
      loadFests();
    }
  }, [activeOrganization, orgLoading, loadFests]);

  // Quick lifecycle action handlers
  const handleQuickPublish = async (festId: string, festName: string) => {
    try {
      setErrorMsg(null);
      await publishFest(festId);
      setSuccessMsg(`"${festName}" is now published and publicly discoverable!`);
      await loadFests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish festival.');
    }
  };

  const handleQuickComplete = async (festId: string, festName: string) => {
    try {
      setErrorMsg(null);
      await completeFest(festId);
      setSuccessMsg(`"${festName}" marked as completed.`);
      await loadFests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete festival.');
    }
  };

  const handleQuickArchive = async (festId: string, festName: string) => {
    try {
      setErrorMsg(null);
      await archiveFest(festId);
      setSuccessMsg(`"${festName}" has been archived.`);
      await loadFests();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to archive festival.');
    }
  };

  const toast = useToast();
  const [festToDelete, setFestToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!festToDelete) return;
    try {
      setDeleteLoading(true);
      setErrorMsg(null);
      await deleteDraftFest(festToDelete.id);
      toast.success(`Draft festival "${festToDelete.name}" was permanently deleted.`);
      setFestToDelete(null);
      await loadFests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete festival.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuickDelete = (festId: string, festName: string) => {
    setFestToDelete({ id: festId, name: festName });
  };

  // Status Metrics
  const metrics = useMemo(() => {
    return {
      total: fests.length,
      draft: fests.filter(f => f.status === 'draft').length,
      published: fests.filter(f => f.status === 'published').length,
      completed: fests.filter(f => f.status === 'completed').length,
      archived: fests.filter(f => f.status === 'archived').length
    };
  }, [fests]);

  // Filtered & Sorted list
  const filteredFests = useMemo(() => {
    return fests
      .filter((fest) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          fest.name.toLowerCase().includes(query) ||
          fest.description.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || fest.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'updated_desc') {
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        }
        if (sortBy === 'start_asc') {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        if (sortBy === 'start_desc') {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [fests, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Festival Operations
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Festivals
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Create, manage lifecycle states, and oversee collegiate festivals for {activeOrganization?.name || 'your club'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/organizer/fests/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors shadow-lg shadow-[#ff4f1a]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fest</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          role="status"
          className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-200 text-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#191b20] border-[#ff4f1a] text-white'
              : 'bg-[#14161a] border-[#242730] text-[#9da3b4] hover:border-[#2e3442]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider block">Total Fests</span>
          <span className="font-heading text-xl font-bold text-white mt-1 block">{metrics.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('draft')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'draft'
              ? 'bg-[#191b20] border-amber-500 text-white'
              : 'bg-[#14161a] border-[#242730] text-[#9da3b4] hover:border-[#2e3442]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider block text-amber-400">Draft</span>
          <span className="font-heading text-xl font-bold text-white mt-1 block">{metrics.draft}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('published')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'published'
              ? 'bg-[#191b20] border-emerald-500 text-white'
              : 'bg-[#14161a] border-[#242730] text-[#9da3b4] hover:border-[#2e3442]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider block text-emerald-400">Published</span>
          <span className="font-heading text-xl font-bold text-white mt-1 block">{metrics.published}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-[#191b20] border-blue-500 text-white'
              : 'bg-[#14161a] border-[#242730] text-[#9da3b4] hover:border-[#2e3442]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider block text-blue-400">Completed</span>
          <span className="font-heading text-xl font-bold text-white mt-1 block">{metrics.completed}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('archived')}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'archived'
              ? 'bg-[#191b20] border-purple-500 text-white'
              : 'bg-[#14161a] border-[#242730] text-[#9da3b4] hover:border-[#2e3442]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider block text-purple-400">Archived</span>
          <span className="font-heading text-xl font-bold text-white mt-1 block">{metrics.archived}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#14161a] border border-[#242730]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search festivals by title or overview..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
        </div>

        {/* Sort & Quick Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#9da3b4]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#656c80]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#191b20] border border-[#2e3442] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff4f1a] font-mono"
            >
              <option value="updated_desc">Newest Updated</option>
              <option value="start_asc">Upcoming Start Date</option>
              <option value="start_desc">Latest Start Date</option>
              <option value="name_asc">Festival Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Festivals List */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse space-y-2">
          <div className="w-6 h-6 border-2 border-[#ff4f1a] border-t-transparent rounded-full animate-spin mx-auto" />
          <span>Loading organization festivals...</span>
        </div>
      ) : fests.length === 0 ? (
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading text-lg font-bold text-white">No festivals created yet</h3>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              {activeOrganization?.name || 'Your club'} does not have any festivals recorded yet. Create your first festival to host contests, manage competitions, and attract student participants.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/organizer/fests/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors shadow-lg shadow-[#ff4f1a]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Festival</span>
            </Link>
          </div>
        </div>
      ) : filteredFests.length === 0 ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#191b20] text-zinc-500 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold text-white">No matching festivals</h3>
            <p className="text-xs text-[#9da3b4]">
              No festivals match your current filter and search criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-zinc-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFests.map((fest) => {
            const isDraft = fest.status === 'draft';
            const isPublished = fest.status === 'published';
            const isCompleted = fest.status === 'completed';
            const isArchived = fest.status === 'archived';

            return (
              <div
                key={fest.id}
                className="rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#2e3442] p-5 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Festival info with thumbnail preview */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-[#191b20] border border-[#2e3442] overflow-hidden shrink-0 flex items-center justify-center">
                      {fest.bannerUrl ? (
                        <img
                          src={fest.bannerUrl}
                          alt={fest.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CalendarDays className="w-7 h-7 text-zinc-600" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${
                            isPublished
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isDraft
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : isCompleted
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          }`}
                        >
                          {fest.status}
                        </span>

                        <span className="text-[11px] text-[#656c80] font-mono">
                          ID: {fest.id}
                        </span>
                      </div>

                      <Link
                        to={`/organizer/fests/${fest.id}`}
                        className="font-heading text-base font-bold text-white hover:text-[#ff4f1a] transition-colors block truncate"
                        title={fest.name}
                      >
                        {fest.name}
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#9da3b4]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#ff4f1a]" />
                          <span>{formatDateRange(fest.startDate, fest.endDate)}</span>
                        </div>
                        <span className="hidden sm:inline text-zinc-700">•</span>
                        <span className="text-[11px] text-[#656c80] font-mono">
                          Updated {formatDateTime(fest.updatedAt || fest.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                    <Link
                      to={`/organizer/fests/${fest.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
                    >
                      Manage
                    </Link>

                    {(isDraft || isPublished) && (
                      <Link
                        to={`/organizer/fests/${fest.id}/edit`}
                        className="p-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-zinc-300 hover:text-white transition-colors"
                        title="Edit Festival"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Quick Lifecycle Action */}
                    {isDraft && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickPublish(fest.id, fest.name)}
                          className="px-3 py-1.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                          title="Publish Festival"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Publish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDelete(fest.id, fest.name)}
                          className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 text-red-300 transition-colors cursor-pointer"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {isPublished && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(fest.id, fest.name)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer"
                          title="Mark Completed"
                        >
                          Complete
                        </button>
                        <Link
                          to={`/fests/${fest.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-[#ff4f1a] transition-colors"
                          title="View Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}

                    {isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickArchive(fest.id, fest.name)}
                          className="px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                          title="Archive Festival"
                        >
                          <Archive className="w-3 h-3 text-purple-400" />
                          <span>Archive</span>
                        </button>
                        <Link
                          to={`/fests/${fest.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-zinc-400 hover:text-white transition-colors"
                          title="View Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accessible Confirmation Dialog for Draft Festival Deletion */}
      <ConfirmDialog
        isOpen={!!festToDelete}
        onClose={() => setFestToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Draft Festival"
        description={
          festToDelete ? (
            <span>
              Are you sure you want to permanently delete draft festival{' '}
              <strong className="text-white">"{festToDelete.name}"</strong>? All
              draft configurations will be removed immediately. This action cannot be
              undone.
            </span>
          ) : (
            'Are you sure you want to delete this draft festival?'
          )
        }
        confirmLabel="Delete Draft"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
