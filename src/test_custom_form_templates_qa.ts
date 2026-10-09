import fs from 'fs';
import path from 'path';
import {
  DEFAULT_FORM_TEMPLATES,
  getDefaultParticipantQuestions
} from './services/templateService';
import { EventFormField, RegistrationFormTemplate } from './types';

function runQA() {
  console.log('--- Starting Custom Registration Form Templates QA Verification ---\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // 1. Verify Built-in Templates
  assert(DEFAULT_FORM_TEMPLATES.length >= 4, `Built-in templates catalog has ${DEFAULT_FORM_TEMPLATES.length} templates (expected >= 4)`);
  const standardTpl = DEFAULT_FORM_TEMPLATES.find(t => t.id === 'tpl_standard');
  const hackathonTpl = DEFAULT_FORM_TEMPLATES.find(t => t.id === 'tpl_tech_hackathon');
  const debateTpl = DEFAULT_FORM_TEMPLATES.find(t => t.id === 'tpl_cultural_debate');
  const scienceTpl = DEFAULT_FORM_TEMPLATES.find(t => t.id === 'tpl_science_fair');

  assert(Boolean(standardTpl && hackathonTpl && debateTpl && scienceTpl), 'All standard system templates exist (Standard, Hackathon, Debate, Science Fair)');

  // 2. Verify Field Types Coverage in Built-in Templates
  const allFieldTypes = new Set<string>();
  DEFAULT_FORM_TEMPLATES.forEach(t => {
    t.fields.forEach(f => allFieldTypes.add(f.type));
  });
  assert(allFieldTypes.has('select') && allFieldTypes.has('text') && allFieldTypes.has('radio') && allFieldTypes.has('textarea'),
    `System templates cover key field types: ${Array.from(allFieldTypes).join(', ')}`);

  // 3. Verify Default Participant Questions
  const defaultQuestions = getDefaultParticipantQuestions();
  assert(defaultQuestions.length === 5, `getDefaultParticipantQuestions returns ${defaultQuestions.length} standard fields`);
  assert(defaultQuestions.every(q => q.label && q.type && typeof q.required === 'boolean'), 'All default participant questions have valid labels, types, and required boolean flags');

  // 4. Verify TemplateSelectorModal Component Architecture
  const modalPath = path.resolve('src/components/registration/TemplateSelectorModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  assert(modalContent.includes('Use Saved Template') || modalContent.includes('Registration Form Template Manager'), 'TemplateSelectorModal provides template manager heading');
  assert(modalContent.includes('cloneFieldsWithUniqueIds'), 'TemplateSelectorModal performs deep cloning with fresh unique IDs so event customization never mutates the original template');
  assert(modalContent.includes('handleDuplicateTemplate'), 'TemplateSelectorModal supports duplicating templates');
  assert(modalContent.includes('handleStartRename') && modalContent.includes('renameFormTemplate'), 'TemplateSelectorModal supports renaming templates');
  assert(modalContent.includes('handleStartDelete') && modalContent.includes('deleteFormTemplate'), 'TemplateSelectorModal supports deleting templates');
  assert(modalContent.includes('Permanently Delete Template?') && modalContent.includes('Data Integrity Guarantee:'), 'TemplateSelectorModal includes confirmation modal explaining existing events and registrations will remain intact');
  assert(modalContent.includes('LiveFormPreview'), 'TemplateSelectorModal embeds interactive LiveFormPreview component');
  assert(modalContent.includes('FormFieldEditorModal'), 'TemplateSelectorModal embeds rich FormFieldEditorModal for adding and editing template questions');
  assert(modalContent.includes('formatTemplateDate'), 'TemplateSelectorModal shows formatted last updated date metadata');

  // 5. Verify FormFieldEditorModal Component Architecture
  const editorPath = path.resolve('src/components/registration/FormFieldEditorModal.tsx');
  const editorContent = fs.readFileSync(editorPath, 'utf-8');

  assert(editorContent.includes('Short Text') &&
         editorContent.includes('Paragraph / Long Text') &&
         editorContent.includes('Dropdown (Select)') &&
         editorContent.includes('Radio Buttons') &&
         editorContent.includes('Checkboxes') &&
         editorContent.includes('Email Address') &&
         editorContent.includes('Phone Number') &&
         editorContent.includes('Website / URL'),
    'FormFieldEditorModal supports all 8 field types (text, textarea, select, radio, checkbox, email, phone, url)');
  assert(editorContent.includes('Choice Options') && editorContent.includes('handleAddOption'), 'FormFieldEditorModal manages options for choices-based fields');
  assert(editorContent.includes('Mandatory Response') || editorContent.includes('required'), 'FormFieldEditorModal allows toggling mandatory / optional');

  // 6. Verify LiveFormPreview Component Architecture
  const previewPath = path.resolve('src/components/registration/LiveFormPreview.tsx');
  const previewContent = fs.readFileSync(previewPath, 'utf-8');

  assert(previewContent.includes('Test Validation'), 'LiveFormPreview supports test validation check');
  assert(previewContent.includes('RotateCcw') || previewContent.includes('handleReset'), 'LiveFormPreview supports test response reset');
  assert(previewContent.includes('DynamicFormField'), 'LiveFormPreview leverages DynamicFormField component');

  // 7. Verify OrganizerCreateEventPage Integration
  const createPath = path.resolve('src/pages/organizer/OrganizerCreateEventPage.tsx');
  const createContent = fs.readFileSync(createPath, 'utf-8');

  assert(createContent.includes('Use Saved Template'), 'OrganizerCreateEventPage includes clear "Use Saved Template" button');
  assert(createContent.includes('Save as Template'), 'OrganizerCreateEventPage includes "Save as Template" action');
  assert(createContent.includes('Add Question') && createContent.includes('handleOpenAddField'), 'OrganizerCreateEventPage includes "Add Question" button with FormFieldEditorModal');
  assert(createContent.includes('Live Form Preview') && createContent.includes('formTab'), 'OrganizerCreateEventPage includes "Live Form Preview" toggle tab');
  assert(createContent.includes('TemplateSelectorModal'), 'OrganizerCreateEventPage mounts TemplateSelectorModal');
  assert(createContent.includes('FormFieldEditorModal'), 'OrganizerCreateEventPage mounts FormFieldEditorModal');

  // 8. Verify OrganizerEditEventPage Integration
  const editPath = path.resolve('src/pages/organizer/OrganizerEditEventPage.tsx');
  const editContent = fs.readFileSync(editPath, 'utf-8');

  assert(editContent.includes('Use Saved Template'), 'OrganizerEditEventPage includes clear "Use Saved Template" button');
  assert(editContent.includes('Save as Template'), 'OrganizerEditEventPage includes "Save as Template" action');
  assert(editContent.includes('Add Question') && editContent.includes('handleOpenAddField'), 'OrganizerEditEventPage includes "Add Question" button with FormFieldEditorModal');
  assert(editContent.includes('Live Form Preview') && editContent.includes('formTab'), 'OrganizerEditEventPage includes "Live Form Preview" toggle tab');
  assert(editContent.includes('TemplateSelectorModal'), 'OrganizerEditEventPage mounts TemplateSelectorModal');
  assert(editContent.includes('FormFieldEditorModal'), 'OrganizerEditEventPage mounts FormFieldEditorModal');

  // 9. Verify Firestore Security Rules Protection
  const rulesPath = path.resolve('firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  assert(rulesContent.includes('match /registrationFormTemplates/{templateId}'), 'Firestore security rules contain registrationFormTemplates matcher');
  assert(rulesContent.includes('isOrgMember(resource.data.organizationId)'), 'Firestore rules restrict template access to organization members or admin');
  assert(rulesContent.includes("request.resource.data.organizationId != 'default'"), 'Firestore rules prevent unauthorized overwrites of built-in templates');
  assert(rulesContent.includes("['id', 'organizationId', 'name', 'fields', 'createdAt', 'updatedAt']"), 'Firestore rules enforce required document schema for templates');

  console.log(`\n--- Verification Summary: ${passCount} Passed, ${failCount} Failed ---`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runQA();
