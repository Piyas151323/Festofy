import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Check,
  Plus,
  Trash2,
  X,
  Copy,
  ChevronRight,
  BookmarkPlus,
  Edit2,
  UserCheck,
  ArrowUp,
  ArrowDown,
  Search,
  Eye,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { RegistrationFormTemplate, EventFormField } from '../../types';
import {
  getOrganizationFormTemplates,
  saveFormTemplate,
  updateFormTemplate,
  renameFormTemplate,
  deleteFormTemplate,
  getDefaultParticipantQuestions
} from '../../services/templateService';
import { FormFieldEditorModal } from './FormFieldEditorModal';
import { LiveFormPreview } from './LiveFormPreview';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSelectTemplate: (fields: EventFormField[]) => void;
  currentFieldsToSave?: EventFormField[];
}

type ModalView = 'browse' | 'create_new' | 'edit_template' | 'save_current';

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSelectTemplate,
  currentFieldsToSave
}) => {
  const [templates, setTemplates] = useState<RegistrationFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ModalView>('browse');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'default'>('all');

  // Preview tab in right column: 'outline' | 'live'
  const [previewMode, setPreviewMode] = useState<'outline' | 'live'>('outline');

  // Success / notice feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rename modal state
  const [renamingTemplate, setRenamingTemplate] = useState<RegistrationFormTemplate | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Delete confirmation modal state
  const [templateToDelete, setTemplateToDelete] = useState<RegistrationFormTemplate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create new template state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateFields, setNewTemplateFields] = useState<EventFormField[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit existing template state
  const [editingTemplate, setEditingTemplate] = useState<RegistrationFormTemplate | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFields, setEditFields] = useState<EventFormField[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // Save current event fields state
  const [saveCurrentName, setSaveCurrentName] = useState('');
  const [saveCurrentDesc, setSaveCurrentDesc] = useState('');
  const [saveCurrentLoading, setSaveCurrentLoading] = useState(false);

  // Field Editor Modal state (for adding/editing questions inside a template)
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [fieldEditorTarget, setFieldEditorTarget] = useState<'new' | 'edit'>('new');
  const [fieldToEdit, setFieldToEdit] = useState<EventFormField | null>(null);
  const [fieldToEditIndex, setFieldToEditIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!isOpen || !organizationId) return;
      try {
        setLoading(true);
        const list = await getOrganizationFormTemplates(organizationId);
        setTemplates(list);
        if (list.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(list[0].id);
        }
      } catch (err) {
        console.warn('Notice loading templates:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen, organizationId]);

  // Clear notice after 3 seconds
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterType === 'custom') return !tpl.isDefault;
    if (filterType === 'default') return Boolean(tpl.isDefault);
    return true;
  });

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0] || templates[0];

  // Helper to deep-clone questions with unique IDs
  const cloneFieldsWithUniqueIds = (sourceFields: EventFormField[]): EventFormField[] => {
    const clonedFields: EventFormField[] = sourceFields.map((f, idx) => ({
      ...f,
      id: `field_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      ...(f.options ? { options: [...f.options] } : {})
    }));
    return clonedFields;
  };

  const handleApplyTemplate = (tpl: RegistrationFormTemplate) => {
    if (!tpl.fields || tpl.fields.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'This template has no questions to apply.' });
      return;
    }
    const cloned = cloneFieldsWithUniqueIds(tpl.fields);
    onSelectTemplate(cloned);
    onClose();
  };

  const handleApplyDefaultQuestions = () => {
    const defaults = getDefaultParticipantQuestions();
    const cloned = cloneFieldsWithUniqueIds(defaults);
    onSelectTemplate(cloned);
    onClose();
  };

  const handleApplyDefaultFields = handleApplyDefaultQuestions;

  // Duplicate an existing template
  const handleDuplicateTemplate = async (tpl: RegistrationFormTemplate) => {
    try {
      setFeedbackMsg(null);
      const duplicateName = `${tpl.name} (Copy)`;
      const duplicateDesc = tpl.description || 'Duplicated registration template';
      const clonedFields = cloneFieldsWithUniqueIds(tpl.fields);

      const saved = await saveFormTemplate(
        organizationId,
        duplicateName,
        duplicateDesc,
        clonedFields
      );

      setTemplates((prev) => [...prev, saved]);
      setSelectedTemplateId(saved.id);
      setFeedbackMsg({ type: 'success', text: `Template duplicated as "${duplicateName}".` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to duplicate template.' });
    }
  };

  // Start Rename
  const handleStartRename = (tpl: RegistrationFormTemplate) => {
    setRenamingTemplate(tpl);
    setRenameInputValue(tpl.name);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingTemplate) return;
    const cleanName = renameInputValue.trim();
    if (!cleanName) {
      setFeedbackMsg({ type: 'error', text: 'Template name cannot be empty.' });
      return;
    }

    try {
      setRenameLoading(true);
      await renameFormTemplate(renamingTemplate.id, cleanName);
      setTemplates((prev) =>
        prev.map((t) => (t.id === renamingTemplate.id ? { ...t, name: cleanName } : t))
      );
      setFeedbackMsg({ type: 'success', text: `Template renamed to "${cleanName}".` });
      setRenamingTemplate(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to rename template.' });
    } finally {
      setRenameLoading(false);
    }
  };

  // Start Delete
  const handleStartDelete = (tpl: RegistrationFormTemplate) => {
    setTemplateToDelete(tpl);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteFormTemplate(templateToDelete.id);
      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      if (selectedTemplateId === templateToDelete.id) {
        setSelectedTemplateId(templates.find((t) => t.id !== templateToDelete.id)?.id || null);
      }
      setFeedbackMsg({ type: 'success', text: `Template "${templateToDelete.name}" deleted.` });
      setTemplateToDelete(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Could not delete template.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Start Edit Template
  const handleStartEditTemplate = (tpl: RegistrationFormTemplate) => {
    setEditingTemplate(tpl);
    setEditName(tpl.name);
    setEditDesc(tpl.description || '');
    setEditFields(cloneFieldsWithUniqueIds(tpl.fields));
    setCurrentView('edit_template');
  };

  const handleSaveEditedTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    const cleanName = editName.trim();
    if (!cleanName) {
      setFeedbackMsg({ type: 'error', text: 'Template title cannot be empty.' });
      return;
    }

    try {
      setEditLoading(true);
      await updateFormTemplate(editingTemplate.id, {
        name: cleanName,
        description: editDesc.trim(),
        fields: editFields
      });

      const updatedNow = new Date().toISOString();
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: cleanName,
                description: editDesc.trim(),
                fields: editFields,
                updatedAt: updatedNow
              }
            : t
        )
      );
      setFeedbackMsg({ type: 'success', text: `Template "${cleanName}" updated successfully.` });
      setCurrentView('browse');
      setEditingTemplate(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to update template.' });
    } finally {
      setEditLoading(false);
    }
  };

  // Start Create New Template
  const handleStartCreateNew = (startWithDefaults = false) => {
    setNewTemplateName('');
    setNewTemplateDesc('');
    if (startWithDefaults) {
      setNewTemplateFields(cloneFieldsWithUniqueIds(getDefaultParticipantQuestions()));
    } else {
      setNewTemplateFields([]);
    }
    setCurrentView('create_new');
  };

  const handleSaveNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newTemplateName.trim();
    if (!cleanName) {
      setFeedbackMsg({ type: 'error', text: 'Template title is required.' });
      return;
    }
    if (newTemplateFields.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please add at least one question to the template.' });
      return;
    }

    try {
      setCreateLoading(true);
      const saved = await saveFormTemplate(
        organizationId,
        cleanName,
        newTemplateDesc.trim(),
        newTemplateFields
      );
      setTemplates((prev) => [...prev, saved]);
      setSelectedTemplateId(saved.id);
      setFeedbackMsg({ type: 'success', text: `New template "${cleanName}" created successfully.` });
      setCurrentView('browse');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to create template.' });
    } finally {
      setCreateLoading(false);
    }
  };

  // Start Save Current Event Fields as Template
  const handleStartSaveCurrent = () => {
    setSaveCurrentName('');
    setSaveCurrentDesc('');
    setCurrentView('save_current');
  };

  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = saveCurrentName.trim();
    if (!cleanName) {
      setFeedbackMsg({ type: 'error', text: 'Template title is required.' });
      return;
    }
    if (!currentFieldsToSave || currentFieldsToSave.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No questions in current event to save.' });
      return;
    }

    try {
      setSaveCurrentLoading(true);
      const cloned = cloneFieldsWithUniqueIds(currentFieldsToSave);
      const saved = await saveFormTemplate(
        organizationId,
        cleanName,
        saveCurrentDesc.trim(),
        cloned
      );
      setTemplates((prev) => [...prev, saved]);
      setSelectedTemplateId(saved.id);
      setFeedbackMsg({ type: 'success', text: `Template "${cleanName}" saved successfully.` });
      setCurrentView('browse');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to save template.' });
    } finally {
      setSaveCurrentLoading(false);
    }
  };

  // Field Reordering in Edit / New modes
  const handleMoveField = (target: 'new' | 'edit', index: number, direction: 'up' | 'down') => {
    const listSetter = target === 'new' ? setNewTemplateFields : setEditFields;
    listSetter((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemoveField = (target: 'new' | 'edit', index: number) => {
    const listSetter = target === 'new' ? setNewTemplateFields : setEditFields;
    listSetter((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Field Editor Modal handlers (Add or Edit question in template)
  const openFieldEditorForAdd = (target: 'new' | 'edit') => {
    setFieldEditorTarget(target);
    setFieldToEdit(null);
    setFieldToEditIndex(null);
    setIsFieldEditorOpen(true);
  };

  const openFieldEditorForEdit = (target: 'new' | 'edit', field: EventFormField, index: number) => {
    setFieldEditorTarget(target);
    setFieldToEdit(field);
    setFieldToEditIndex(index);
    setIsFieldEditorOpen(true);
  };

  const handleSaveFieldFromEditor = (field: EventFormField) => {
    const listSetter = fieldEditorTarget === 'new' ? setNewTemplateFields : setEditFields;
    listSetter((prev) => {
      if (fieldToEditIndex !== null && fieldToEditIndex >= 0) {
        const copy = [...prev];
        copy[fieldToEditIndex] = field;
        return copy;
      }
      return [...prev, field];
    });
    setIsFieldEditorOpen(false);
    setFieldToEdit(null);
    setFieldToEditIndex(null);
  };

  const formatTemplateDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-3xl bg-[#14161a] border border-[#2e3442] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#242730] flex flex-wrap items-center justify-between gap-3 bg-[#111317]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff4f1a]/15 text-[#ff4f1a] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Registration Form Template Manager</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191b20] border border-[#2e3442] text-zinc-400">
                  {templates.length} Saved
                </span>
              </h3>
              <p className="text-xs text-[#9da3b4] hidden sm:block">
                Create reusable templates, customize event copies independently, and streamline participant onboarding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'browse' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStartCreateNew(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Template</span>
                </button>
                {currentFieldsToSave && currentFieldsToSave.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartSaveCurrent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Save current event questions as a reusable template"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span className="hidden sm:inline">Save Current Fields</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleApplyDefaultQuestions}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Use standard participant fields"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#ff4f1a]" />
                  <span className="hidden md:inline">Standard Fields</span>
                </button>
              </>
            )}

            {currentView !== 'browse' && (
              <button
                type="button"
                onClick={() => setCurrentView('browse')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>Back to Templates</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/70 border-b border-emerald-900 text-emerald-300'
                : 'bg-red-950/70 border-b border-red-900 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'browse' && (
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Template List & Filters (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                {/* Search & Category Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates by title or keywords..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFilterType('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterType === 'all'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      All ({templates.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('custom')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterType === 'custom'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Custom ({templates.filter((t) => !t.isDefault).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('default')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterType === 'default'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Built-in ({templates.filter((t) => t.isDefault).length})
                    </button>
                  </div>
                </div>

                {/* Templates List */}
                {loading ? (
                  <div className="p-8 text-center text-xs text-zinc-500 animate-pulse space-y-2">
                    <Layers className="w-6 h-6 mx-auto text-zinc-600 animate-spin" />
                    <span>Loading saved templates...</span>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#191b20] border border-[#242730] text-center space-y-2">
                    <FileText className="w-6 h-6 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400 font-semibold">No templates match filter</p>
                    <button
                      type="button"
                      onClick={() => handleStartCreateNew(false)}
                      className="text-xs text-[#ff4f1a] hover:underline font-semibold"
                    >
                      Create a new template now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                    {filteredTemplates.map((tpl) => {
                      const isSelected = tpl.id === selectedTemplateId;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#1e222b] border-[#ff4f1a] text-white shadow-md'
                              : 'bg-[#191b20] border-[#2e3442] text-zinc-300 hover:border-zinc-600 hover:bg-[#1a1d24]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white truncate">
                                  {tpl.name}
                                </span>
                                {tpl.isDefault ? (
                                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono shrink-0">
                                    Built-in
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-[#ff4f1a]/15 text-[10px] text-[#ff4f1a] font-mono shrink-0">
                                    Custom
                                  </span>
                                )}
                              </div>

                              {tpl.description && (
                                <p className="text-[11px] text-[#9da3b4] line-clamp-1 mt-0.5">
                                  {tpl.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[10px] text-[#656c80] mt-2 font-mono">
                                <span>{tpl.fields.length} questions</span>
                                {tpl.updatedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {formatTemplateDate(tpl.updatedAt)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action icons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Duplicate button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateTemplate(tpl);
                                }}
                                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                                title="Duplicate template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {!tpl.isDefault && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRename(tpl);
                                    }}
                                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                                    title="Rename template"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartDelete(tpl);
                                    }}
                                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Delete template"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Template Preview & Apply (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl bg-[#191b20] border border-[#2e3442] p-5 flex flex-col justify-between">
                {activeTemplate ? (
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="border-b border-[#2e3442] pb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 max-w-md">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-base font-bold text-white truncate">
                            {activeTemplate.name}
                          </h4>
                          {activeTemplate.isDefault ? (
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                              Built-in
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#ff4f1a]/15 text-[10px] text-[#ff4f1a] font-mono">
                              Custom Template
                            </span>
                          )}
                        </div>
                        {activeTemplate.description && (
                          <p className="text-xs text-[#9da3b4] mt-1 leading-relaxed">
                            {activeTemplate.description}
                          </p>
                        )}
                        <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                          Last updated: {formatTemplateDate(activeTemplate.updatedAt) || 'Initial release'}
                        </div>
                      </div>

                      {/* Mode toggles */}
                      <div className="flex items-center gap-1 p-1 bg-[#14161a] border border-[#242730] rounded-xl text-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('outline')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            previewMode === 'outline'
                              ? 'bg-zinc-800 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Questions Outline
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('live')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                            previewMode === 'live'
                              ? 'bg-zinc-800 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Live Form Preview</span>
                        </button>
                      </div>
                    </div>

                    {/* Preview Content */}
                    {previewMode === 'outline' ? (
                      <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                        {activeTemplate.fields.map((field, idx) => (
                          <div
                            key={field.id || idx}
                            className="p-3.5 rounded-xl bg-[#14161a] border border-[#242730] flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span className="font-mono text-[11px] text-zinc-500">#{idx + 1}</span>
                                <span className="truncate">{field.label}</span>
                                {field.required ? (
                                  <span className="text-[#ff4f1a] font-bold text-[10px] uppercase font-mono">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-[10px] font-mono">Optional</span>
                                )}
                              </div>
                              {field.placeholder && (
                                <p className="text-[11px] text-[#656c80] italic">
                                  Placeholder: "{field.placeholder}"
                                </p>
                              )}
                              {field.helpText && (
                                <p className="text-[11px] text-[#9da3b4]">{field.helpText}</p>
                              )}
                              {field.options && field.options.length > 0 && (
                                <div className="text-[10px] text-zinc-400 mt-1 flex flex-wrap gap-1">
                                  <span className="text-zinc-500 font-mono">Choices:</span>
                                  {field.options.map((opt, oi) => (
                                    <span
                                      key={oi}
                                      className="px-1.5 py-0.5 rounded bg-[#1e222b] border border-[#2e3442]"
                                    >
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-[10px] uppercase text-[#ff4f1a] bg-[#ff4f1a]/10 px-2 py-0.5 rounded shrink-0">
                              {field.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="max-h-[46vh] overflow-y-auto pr-1">
                        <LiveFormPreview
                          fields={activeTemplate.fields}
                          title={`${activeTemplate.name} · Preview`}
                        />
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-[#2e3442] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {!activeTemplate.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleStartEditTemplate(activeTemplate)}
                            className="px-3 py-1.5 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#ff4f1a]" />
                            <span>Edit Template</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDuplicateTemplate(activeTemplate)}
                          className="px-3 py-1.5 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Duplicate</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-400 hidden sm:inline">
                          Applying creates an independent copy for this event.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(activeTemplate)}
                          className="px-5 py-2.5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all shadow-lg shadow-[#ff4f1a]/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Apply Template to Event</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-500 text-xs">
                    Select a template from the list to preview and apply questions.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: CREATE NEW TEMPLATE */}
          {currentView === 'create_new' && (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
              <div className="border-b border-[#242730] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#ff4f1a]" />
                    <span>Create Custom Registration Template</span>
                  </h4>
                  <p className="text-xs text-[#9da3b4] mt-0.5">
                    Build a reusable question suite that can be applied to any future contest or challenge.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartCreateNew(true)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white"
                  >
                    Load Standard Fields
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveNewTemplate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Template Title *</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. Hackathon Engineering Application"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Description</label>
                    <input
                      type="text"
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      placeholder="Short note about when to use this template..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>
                </div>

                {/* Question builder section */}
                <div className="p-4 rounded-2xl bg-[#191b20] border border-[#2e3442] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                      Questions ({newTemplateFields.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => openFieldEditorForAdd('new')}
                      className="px-3 py-1.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {newTemplateFields.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#14161a] border border-[#242730] text-center space-y-2">
                      <p className="text-xs text-zinc-400">No questions added to this template yet.</p>
                      <button
                        type="button"
                        onClick={() => openFieldEditorForAdd('new')}
                        className="text-xs text-[#ff4f1a] hover:underline font-semibold"
                      >
                        + Add your first question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {newTemplateFields.map((f, idx) => (
                        <div
                          key={f.id || idx}
                          className="p-3 rounded-xl bg-[#14161a] border border-[#242730] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Reorder */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveField('new', idx, 'up')}
                                disabled={idx === 0}
                                className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveField('new', idx, 'down')}
                                disabled={idx === newTemplateFields.length - 1}
                                className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono text-zinc-500 text-[11px]">#{idx + 1}</span>
                            <span className="font-semibold text-white truncate">{f.label}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[#191b20] text-zinc-400 font-mono text-[10px]">
                              {f.type}
                            </span>
                            {f.required && (
                              <span className="text-[10px] text-[#ff4f1a] font-bold">Required</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openFieldEditorForEdit('new', f, idx)}
                              className="p-1 text-zinc-400 hover:text-white"
                              title="Edit question"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveField('new', idx)}
                              className="p-1 text-zinc-500 hover:text-rose-400"
                              title="Remove question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242730]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('browse')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 bg-[#191b20] border border-[#2e3442] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || newTemplateFields.length === 0}
                    className="px-6 py-2 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {createLoading ? 'Saving...' : 'Save Reusable Template'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: EDIT EXISTING TEMPLATE */}
          {currentView === 'edit_template' && editingTemplate && (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
              <div className="border-b border-[#242730] pb-3">
                <h4 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#ff4f1a]" />
                  <span>Edit Custom Template: {editingTemplate.name}</span>
                </h4>
                <p className="text-xs text-[#9da3b4] mt-0.5">
                  Modifying this template updates its blueprint for future events. Past registrations remain unaffected.
                </p>
              </div>

              <form onSubmit={handleSaveEditedTemplate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Template Title *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Template title"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Description</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Template description"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>
                </div>

                {/* Edit fields section */}
                <div className="p-4 rounded-2xl bg-[#191b20] border border-[#2e3442] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                      Questions ({editFields.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => openFieldEditorForAdd('edit')}
                      className="px-3 py-1.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {editFields.map((f, idx) => (
                      <div
                        key={f.id || idx}
                        className="p-3 rounded-xl bg-[#14161a] border border-[#242730] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveField('edit', idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveField('edit', idx, 'down')}
                              disabled={idx === editFields.length - 1}
                              className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono text-zinc-500 text-[11px]">#{idx + 1}</span>
                          <span className="font-semibold text-white truncate">{f.label}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#191b20] text-zinc-400 font-mono text-[10px]">
                            {f.type}
                          </span>
                          {f.required && (
                            <span className="text-[10px] text-[#ff4f1a] font-bold">Required</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openFieldEditorForEdit('edit', f, idx)}
                            className="p-1 text-zinc-400 hover:text-white"
                            title="Edit question"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveField('edit', idx)}
                            className="p-1 text-zinc-500 hover:text-rose-400"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242730]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('browse')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 bg-[#191b20] border border-[#2e3442] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading || editFields.length === 0}
                    className="px-6 py-2 rounded-xl font-heading text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: SAVE CURRENT EVENT FIELDS */}
          {currentView === 'save_current' && (
            <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
              <div className="border-b border-[#242730] pb-3">
                <h4 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-[#ff4f1a]" />
                  <span>Save Current Questions as Template</span>
                </h4>
                <p className="text-xs text-[#9da3b4] mt-0.5">
                  Snapshot the {currentFieldsToSave?.length || 0} questions you configured for this event so other organizers and future events can reuse them.
                </p>
              </div>

              <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">New Template Title *</label>
                  <input
                    type="text"
                    value={saveCurrentName}
                    onChange={(e) => setSaveCurrentName(e.target.value)}
                    placeholder="e.g. Science Fair Standard Registration"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Description</label>
                  <textarea
                    rows={2}
                    value={saveCurrentDesc}
                    onChange={(e) => setSaveCurrentDesc(e.target.value)}
                    placeholder="Brief description of requirements..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#191b20] border border-[#242730] text-xs space-y-2">
                  <span className="font-semibold text-white block">
                    Questions to be included ({currentFieldsToSave?.length || 0}):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-[11px] text-zinc-300">
                    {currentFieldsToSave?.map((f, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="truncate">{f.label}</span>
                        <span className="text-zinc-500 font-mono text-[10px]">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242730]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('browse')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 bg-[#191b20] border border-[#2e3442] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveCurrentLoading || !saveCurrentName.trim()}
                    className="px-6 py-2 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saveCurrentLoading ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* RENAME DIALOG MODAL */}
      {renamingTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-sm rounded-2xl bg-[#191b20] border border-[#2e3442] p-5 shadow-2xl space-y-4">
            <h4 className="font-heading text-sm font-bold text-white">Rename Template</h4>
            <form onSubmit={handleConfirmRename} className="space-y-3">
              <input
                type="text"
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                placeholder="Template name"
                className="w-full px-3 py-2 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenamingTemplate(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !renameInputValue.trim()}
                  className="px-4 py-1.5 rounded-lg font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] disabled:opacity-50"
                >
                  {renameLoading ? 'Renaming...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {templateToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-2xl bg-[#191b20] border border-rose-900/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  Permanently Delete Template?
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Are you sure you want to delete <span className="text-white font-semibold">"{templateToDelete.name}"</span>?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#14161a] border border-[#242730] text-xs text-[#9da3b4] space-y-1">
              <p className="text-zinc-300 font-semibold">Data Integrity Guarantee:</p>
              <p>
                Existing events and already submitted participant registrations will remain completely intact and unaffected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#14161a] border border-[#242730]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl font-heading text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-900/30"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIELD EDITOR MODAL (For adding or editing individual questions inside a template) */}
      <FormFieldEditorModal
        isOpen={isFieldEditorOpen}
        onClose={() => setIsFieldEditorOpen(false)}
        onSave={handleSaveFieldFromEditor}
        initialField={fieldToEdit}
      />
    </div>
  );
};
