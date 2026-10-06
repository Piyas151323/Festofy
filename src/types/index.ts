export type UserRoleType = 'student' | 'organizer' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleDoc {
  role: UserRoleType;
  createdAt: string;
  updatedAt: string;
}

export type OrganizationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  institution?: string;
  status: OrganizationStatus;
  rejectionReason?: string;
  requestedBy?: string;
  requestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequestInput {
  name: string;
  description?: string;
  logoUrl?: string;
  institution?: string;
}

export type OrgMemberRole = 'owner' | 'organizer';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgMemberRole;
  createdAt: string;
}

export type FestStatus = 'draft' | 'published' | 'completed' | 'archived';

export interface Fest {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  status: FestStatus;
  createdAt: string;
  updatedAt: string;
  // Denormalized/populated fields for UI conveniences
  organizationName?: string;
  organizationLogo?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled';

export interface EventItem {
  id: string;
  festId: string;
  organizationId: string;
  categoryId: string;
  name: string;
  description: string;
  bannerUrl?: string;
  venue: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  // Denormalized/populated for display
  festName?: string;
  categoryName?: string;
  organizationName?: string;
  // Registration Architecture fields
  currentRegistrations?: number;
  registrationType?: 'individual' | 'team' | 'both';
  minTeamSize?: number;
  maxTeamSize?: number;
  requiresApproval?: boolean;
  customFormFields?: EventFormField[];
  isRegistrationClosed?: boolean;
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'completed' | 'checked_in';

export type RegistrationType = 'individual' | 'team';

export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | 'phone' | 'url';

export interface EventFormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
  validationRule?: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  institution?: string;
  studentId?: string;
  role?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  festId: string;
  organizationId: string;
  userId: string;
  ticketCode: string;
  status: RegistrationStatus;
  registrationType: RegistrationType;
  // Participant snapshot
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  institution?: string;
  studentId?: string;
  // Team details
  teamName?: string;
  teamMembers?: TeamMember[];
  // Event & Fest metadata snapshot for instant display and pass rendering
  eventName: string;
  festName: string;
  categoryName?: string;
  venue: string;
  startTime: string;
  endTime?: string;
  organizationName?: string;
  // Dynamic form response data
  registrationData: Record<string, unknown>;
  // Audit timestamps & lifecycle
  registeredAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  notes?: string;
}

export interface CreateRegistrationInput {
  eventId: string;
  festId: string;
  organizationId: string;
  userId: string;
  registrationType?: RegistrationType;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  institution?: string;
  studentId?: string;
  teamName?: string;
  teamMembers?: TeamMember[];
  eventName: string;
  festName: string;
  categoryName?: string;
  venue: string;
  startTime: string;
  endTime?: string;
  organizationName?: string;
  registrationData?: Record<string, unknown>;
  status?: RegistrationStatus;
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRoleType;
  loading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}
