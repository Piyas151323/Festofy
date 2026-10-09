import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import { RegistrationFormTemplate, EventFormField } from '../../types';
import {
  getOrganizationFormTemplates,
  saveFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  getDefaultParticipantQuestions
} from '../../services/templateService';
import { Modal, ConfirmDialog, useToast } from '../ui';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSelectTemplate: (fields: EventFormField[]) => void;
  currentFieldsToSave?: EventFormField[];
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSelectTemplate,
  currentFieldsToSave
}) => {
  const toast = useToast();
  const [templates, setTemplates] = useState<RegistrationFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Save current fields state
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editing existing custom template state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFields, setEditFields] = useState<EventFormField[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deletion confirmation state
  const [templateToDelete, setTemplateToDelete] = useState<RegistrationFormTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

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

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleApply = (fieldsToApply?: EventFormField[]) => {
    const sourceFields = fieldsToApply || activeTemplate?.fields;
    if (sourceFields) {
      // Deep clone fields with fresh unique IDs so modifying the event never mutates the original template
      const clonedFields: EventFormField[] = sourceFields.map((f, idx) => ({
        ...f,
        id: `field_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`
      }));
      onSelectTemplate(clonedFields);
      onClose();
    }
  };

  const handleApplyDefaultFields = () => {
    const defaults = getDefaultParticipantQuestions();
    onSelectTemplate(defaults);
    onClose();
  };

  const handleStartEditTemplate = (tpl: RegistrationFormTemplate) => {
    setEditingTemplateId(tpl.id);
    setEditName(tpl.name);
    setEditDesc(tpl.description || '');
    setEditFields([...tpl.fields]);
    setEditError(null);
  };

  const handleSaveEditedTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplateId || !editName.trim()) {
      setEditError('Template name cannot be empty.');
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await updateFormTemplate(editingTemplateId, {
        name: editName.trim(),
        description: editDesc.trim(),
        fields: editFields
      });

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId
            ? { ...t, name: editName.trim(), description: editDesc.trim(), fields: editFields }
            : t
        )
      );
      setEditingTemplateId(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update template.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      setSaveError('Template title is required.');
      return;
    }
    if (!currentFieldsToSave || currentFieldsToSave.length === 0) {
      setSaveError('No questions to save in this template.');
      return;
    }

    try {
      setSaveLoading(true);
      setSaveError(null);
      const saved = await saveFormTemplate(
        organizationId,
        newTemplateName.trim(),
        newTemplateDesc.trim(),
        currentFieldsToSave
      );
      setTemplates((prev) => [...prev, saved]);
      setSelectedTemplateId(saved.id);
      setIsSavingNew(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save template.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteCustomTemplate = async (template: RegistrationFormTemplate) => {
    try {
      setDeletingTemplate(true);
      await deleteFormTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      if (selectedTemplateId === template.id) {
        setSelectedTemplateId(templates[0]?.id || null);
      }
      if (editingTemplateId === template.id) {
        setEditingTemplateId(null);
      }
      setTemplateToDelete(null);
      toast.success(`Template "${template.name}" has been deleted.`);
    } catch (err: any) {
      toast.error(err.message || 'Could not delete template.');
    } finally {
      setDeletingTemplate(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        hideCloseButton
      >
        {/* Header */}
        <div className="p-5 border-b border-[#242730] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ff4f1a]/15 text-[#ff4f1a] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-white">
                Registration Info Form Templates
              </h3>
              <p className="text-xs text-[#9da3b4]">
                Select a template, customize questions, or start with standard participant fields.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyDefaultFields}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Start with Name, Institution, Grade, Phone, Email"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>Use Default Participant Fields</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close template selector"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: 2 columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column: Template List (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>AVAILABLE TEMPLATES</span>
              {currentFieldsToSave && currentFieldsToSave.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSavingNew(!isSavingNew);
                    setEditingTemplateId(null);
                  }}
                  className="text-[#ff4f1a] hover:underline flex items-center gap-1 font-bold"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save Current</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-xs text-zinc-500 py-6 text-center animate-pulse">
                Loading templates...
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setIsSavingNew(false);
                        setEditingTemplateId(null);
                      }}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1e222b] border-[#ff4f1a] text-white shadow-md'
                          : 'bg-[#191b20] border-[#2e3442] text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <div className="min-w-0 pr-2 flex-1">
                        <div className="font-semibold text-xs truncate">{tpl.name}</div>
                        <div className="text-[10px] text-[#656c80] flex items-center gap-2 mt-0.5">
                          <span>{tpl.fields.length} questions</span>
                          {tpl.isDefault ? (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                              Default
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-[#ff4f1a]/15 text-[#ff4f1a] font-mono">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!tpl.isDefault && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditTemplate(tpl);
                              }}
                              className="text-zinc-500 hover:text-zinc-200 p-1"
                              title="Rename / edit template"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateToDelete(tpl);
                              }}
                              className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Preview, Save, or Edit Mode (3 cols) */}
          <div className="md:col-span-3 rounded-2xl bg-[#191b20] border border-[#2e3442] p-5 flex flex-col justify-between">
            {editingTemplateId ? (
              <form onSubmit={handleSaveEditedTemplate} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-[#ff4f1a]" />
                    <span>Edit Custom Template</span>
                  </h4>
                  <p className="text-xs text-[#9da3b4]">
                    Rename this template or update its stored default question set.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Template Title *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Template title"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      placeholder="Template description"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-zinc-400 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>Questions ({editFields.length}):</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {editFields.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 p-1.5 rounded bg-[#191b20] border border-[#242730] text-[11px]"
                        >
                          <span className="truncate text-zinc-200">
                            {f.label} <span className="text-[#656c80]">({f.type})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditFields(editFields.filter((_, idx) => idx !== i))}
                            className="text-zinc-500 hover:text-red-400 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {editError && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-900/60">
                    {editError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-2 px-4 rounded-xl font-heading text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTemplateId(null)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-zinc-400 bg-[#14161a] border border-[#2e3442] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : isSavingNew ? (
              <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                    <BookmarkPlus className="w-4 h-4 text-[#ff4f1a]" />
                    <span>Save Current Questions as Template</span>
                  </h4>
                  <p className="text-xs text-[#9da3b4]">
                    Saving will make this template available across all future events created by this organization.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Template Title *</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. Annual Olympiad Form"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Description</label>
                    <textarea
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      rows={2}
                      placeholder="Brief note about which events should use this form..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-zinc-400">
                    <span className="font-semibold text-white block mb-1">
                      Contains {currentFieldsToSave?.length || 0} Questions:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {currentFieldsToSave?.map((f, i) => (
                        <li key={i} className="truncate">
                          {f.label} ({f.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {saveError && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-900/60">
                    {saveError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 py-2 px-4 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving...' : 'Save Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingNew(false)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-zinc-400 bg-[#14161a] border border-[#2e3442] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : activeTemplate ? (
              <div className="space-y-4">
                <div className="border-b border-[#2e3442] pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-base font-bold text-white">
                      {activeTemplate.name}
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#14161a] border border-[#2e3442] text-zinc-300">
                      {activeTemplate.fields.length} Fields
                    </span>
                  </div>
                  {activeTemplate.description && (
                    <p className="text-xs text-[#9da3b4] mt-1 leading-relaxed">
                      {activeTemplate.description}
                    </p>
                  )}
                </div>

                {/* Question List Preview */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {activeTemplate.fields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="p-3 rounded-xl bg-[#14161a] border border-[#242730] flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{field.label}</span>
                          {field.required && <span className="text-[#ff4f1a]">*</span>}
                        </div>
                        {field.placeholder && (
                          <div className="text-[11px] text-[#656c80] italic mt-0.5">
                            "{field.placeholder}"
                          </div>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div className="text-[10px] text-[#9da3b4] mt-1 flex flex-wrap gap-1">
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

                <div className="pt-4 border-t border-[#2e3442] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    Applying creates an independent copy for this event.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApply()}
                    className="px-5 py-2.5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all shadow-lg shadow-[#ff4f1a]/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Apply This Template</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No template selected.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Accessible Confirmation Dialog for Template Deletion */}
      <ConfirmDialog
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => {
          if (templateToDelete) {
            handleDeleteCustomTemplate(templateToDelete);
          }
        }}
        title="Delete Registration Template"
        description={
          templateToDelete ? (
            <span>
              Are you sure you want to permanently delete custom template{' '}
              <strong className="text-white">"{templateToDelete.name}"</strong>? Any
              existing events already using these questions will remain unaffected, but
              this template will no longer be available for future events.
            </span>
          ) : (
            'Are you sure you want to delete this template?'
          )
        }
        confirmLabel="Delete Template"
        cancelLabel="Keep Template"
        variant="danger"
        loading={deletingTemplate}
      />
    </>
  );
};

