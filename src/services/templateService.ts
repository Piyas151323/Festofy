import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import { RegistrationFormTemplate, EventFormField } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

const COLLECTION_NAME = 'registrationFormTemplates';

export const DEFAULT_FORM_TEMPLATES: RegistrationFormTemplate[] = [
  {
    id: 'tpl_standard',
    organizationId: 'default',
    name: 'Standard Participant Registration',
    description: 'General contest form gathering basic student identification, contact, and academic standing.',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields: [
      {
        id: 'f_class_grade',
        label: 'Class / Grade / Year',
        type: 'select',
        required: true,
        placeholder: 'Select your current class or academic year',
        options: ['Class 6-8 (Junior)', 'Class 9-10 (Secondary/SSC)', 'Class 11-12 (Higher Secondary/HSC)', 'Undergraduate / University', 'Postgraduate', 'Other']
      },
      {
        id: 'f_institution_roll',
        label: 'Institutional Roll / Student ID',
        type: 'text',
        required: false,
        placeholder: 'e.g. 2026-ST-482'
      },
      {
        id: 'f_emergency_phone',
        label: 'Emergency Contact Phone (Parent / Guardian)',
        type: 'phone',
        required: true,
        placeholder: '+880 1XXXXXXXXX'
      },
      {
        id: 'f_tshirt_size',
        label: 'Event T-Shirt Size',
        type: 'select',
        required: false,
        options: ['S', 'M', 'L', 'XL', 'XXL']
      }
    ]
  },
  {
    id: 'tpl_tech_hackathon',
    organizationId: 'default',
    name: 'Tech, Hackathon & Coding Contest',
    description: 'Geared towards programming hackathons, algorithmic contests, and engineering challenges.',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields: [
      {
        id: 'f_languages',
        label: 'Primary Programming Languages',
        type: 'text',
        required: true,
        placeholder: 'e.g. C++, Python, JavaScript, Rust'
      },
      {
        id: 'f_github',
        label: 'GitHub Profile or Portfolio URL',
        type: 'url',
        required: false,
        placeholder: 'https://github.com/username'
      },
      {
        id: 'f_laptop_consent',
        label: 'Will you bring your own laptop and power brick?',
        type: 'radio',
        required: true,
        options: ['Yes, I will bring my own laptop', 'No, I request venue lab workstation access']
      },
      {
        id: 'f_food_preference',
        label: 'Meal / Dietary Preference',
        type: 'select',
        required: true,
        options: ['Regular / Non-Veg', 'Vegetarian', 'No Preference']
      }
    ]
  },
  {
    id: 'tpl_cultural_debate',
    organizationId: 'default',
    name: 'Debate, Quiz & Cultural Competitions',
    description: 'Designed for parliamentary debates, cultural competitions, and academic quizzes.',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields: [
      {
        id: 'f_debate_format',
        label: 'Debate / Presentation Track',
        type: 'select',
        required: true,
        options: ['Bangla Parliamentary', 'English World Schools', 'Quiz Solo', 'Quiz Duo']
      },
      {
        id: 'f_prior_experience',
        label: 'Brief Highlights of Prior Experience / Achievements',
        type: 'textarea',
        required: false,
        placeholder: 'Mention any previous competitions or titles won...'
      },
      {
        id: 'f_club_representative',
        label: 'Are you an official representative of your institution debate/cultural club?',
        type: 'radio',
        required: true,
        options: ['Yes, official club delegation', 'Independent participant']
      }
    ]
  },
  {
    id: 'tpl_science_fair',
    organizationId: 'default',
    name: 'Science Fair & Project Exhibition',
    description: 'Optimized for STEM model exhibitions, robotics show, and research displays.',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    fields: [
      {
        id: 'f_project_title',
        label: 'Project or Model Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Smart IoT Automated Agricultural System'
      },
      {
        id: 'f_project_category',
        label: 'Scientific Sub-Category',
        type: 'select',
        required: true,
        options: ['Physics & Applied Engineering', 'Biology & Environmental Science', 'Robotics & Automation', 'Information Technology', 'Mathematics & Modeling']
      },
      {
        id: 'f_abstract',
        label: 'Project Abstract / Summary (100-300 words)',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your hypothesis, methodology, and prototype...'
      },
      {
        id: 'f_table_power_req',
        label: 'Do you require electric socket (220V) at your booth table?',
        type: 'radio',
        required: true,
        options: ['Yes, 1 Power Socket required', 'Yes, Multi-plug required', 'No electrical connection needed']
      }
    ]
  }
];

export async function getOrganizationFormTemplates(organizationId: string): Promise<RegistrationFormTemplate[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('organizationId', '==', organizationId)
    );
    const snap = await getDocs(q);
    const customList = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as RegistrationFormTemplate));

    return [...DEFAULT_FORM_TEMPLATES, ...customList];
  } catch (err) {
    console.warn('Notice loading organization form templates, returning defaults:', err);
    return DEFAULT_FORM_TEMPLATES;
  }
}

export async function saveFormTemplate(
  organizationId: string,
  name: string,
  description: string,
  fields: EventFormField[]
): Promise<RegistrationFormTemplate> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to save registration form templates.');
  }

  const id = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const payload: RegistrationFormTemplate = {
    id,
    organizationId,
    name: name.trim(),
    description: description.trim(),
    fields,
    isDefault: false,
    createdBy: currentUser.uid,
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
}

export async function updateFormTemplate(
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    fields?: EventFormField[];
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to modify registration form templates.');
  }

  if (DEFAULT_FORM_TEMPLATES.some(t => t.id === templateId)) {
    throw new Error('Built-in system templates cannot be edited directly.');
  }

  const now = new Date().toISOString();
  const docRef = doc(db, COLLECTION_NAME, templateId);

  try {
    const patch: Record<string, any> = { updatedAt: now };
    if (updates.name !== undefined) patch.name = updates.name.trim();
    if (updates.description !== undefined) patch.description = updates.description.trim();
    if (updates.fields !== undefined) patch.fields = updates.fields;

    await setDoc(docRef, patch, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${templateId}`);
    throw error;
  }
}

export async function renameFormTemplate(
  templateId: string,
  newName: string
): Promise<void> {
  return updateFormTemplate(templateId, { name: newName });
}

// Aliases for convenience and API consistency
export const createFormTemplate = saveFormTemplate;
export const getTemplatesByOrganization = getOrganizationFormTemplates;
export function getDefaultParticipantQuestions(): EventFormField[] {
  return [
    {
      id: `f_name_${Date.now()}_1`,
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Full official name'
    },
    {
      id: `f_inst_${Date.now()}_2`,
      label: 'Institution / College / School',
      type: 'text',
      required: true,
      placeholder: 'Current institutional affiliation'
    },
    {
      id: `f_grade_${Date.now()}_3`,
      label: 'Class / Grade / Academic Year',
      type: 'select',
      required: true,
      placeholder: 'Select current grade or level',
      options: [
        'Junior (Class 6-8)',
        'Secondary (Class 9-10 / SSC)',
        'Higher Secondary (Class 11-12 / HSC)',
        'Undergraduate / University',
        'Postgraduate / Masters',
        'Open / Professional'
      ]
    },
    {
      id: `f_phone_${Date.now()}_4`,
      label: 'Contact Phone Number',
      type: 'phone',
      required: true,
      placeholder: '+880 1XXXXXXXXX'
    },
    {
      id: `f_email_${Date.now()}_5`,
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'student@example.com'
    }
  ];
}

export const getDefaultParticipantFields = getDefaultParticipantQuestions;

export async function deleteFormTemplate(templateId: string): Promise<void> {
  // Built-in templates cannot be deleted
  if (DEFAULT_FORM_TEMPLATES.some(t => t.id === templateId)) {
    throw new Error('Default system templates cannot be deleted.');
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${templateId}`);
    throw error;
  }
}
