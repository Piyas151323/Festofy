export type UserRoleType = 'student' | 'organizer' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  institution?: string;
  classGrade?: string;
  participantCategory?: string;
  studentId?: string;
  interests?: string[];
  isProfileComplete?: boolean;
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

export interface UpdateOrganizationInput {
  name?: string;
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

export type VisitorAccessType = 'allowed' | 'restricted' | 'not_allowed';

export interface ParticipantCategoryConfig {
  id: string;
  name: string;
  fee?: number;
  description?: string;
  eligible?: boolean;
}

export interface Fest {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  status: FestStatus;
  visitorAccess?: VisitorAccessType;
  participantCategories?: ParticipantCategoryConfig[];
  createdAt: string;
  updatedAt: string;
  // Denormalized/populated fields for UI conveniences
  organizationName?: string;
  organizationLogo?: string;
  eventCount?: number;
}

export interface CreateFestInput {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  bannerUrl?: string;
  visitorAccess?: VisitorAccessType;
  participantCategories?: ParticipantCategoryConfig[];
  organizationName?: string;
  organizationLogo?: string;
}

export interface UpdateFestInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  bannerUrl?: string;
  visitorAccess?: VisitorAccessType;
  participantCategories?: ParticipantCategoryConfig[];
  organizationName?: string;
  organizationLogo?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  normalizedName?: string;
  createdBy?: string;
  isCustom?: boolean;
  group?: string;
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
  festStatus?: FestStatus;
  visitorAccess?: VisitorAccessType;
  participantCategories?: ParticipantCategoryConfig[];
  isPaid?: boolean;
  baseFee?: number;
  topics?: string[];
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
  organizerWhatsApp?: string;
}

export interface CreateEventInput {
  festId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  bannerUrl?: string;
  venue: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  registrationType?: 'individual' | 'team' | 'both';
  minTeamSize?: number;
  maxTeamSize?: number;
  requiresApproval?: boolean;
  customFormFields?: EventFormField[];
  visitorAccess?: VisitorAccessType;
  participantCategories?: ParticipantCategoryConfig[];
  isPaid?: boolean;
  baseFee?: number;
  topics?: string[];
  organizerWhatsApp?: string;
}

export interface UpdateEventInput {
  categoryId?: string;
  categoryName?: string;
  name?: string;
  description?: string;
  bannerUrl?: string;
  venue?: string;
  startTime?: string;
  endTime?: string;
  registrationDeadline?: string;
  capacity?: number;
  registrationType?: 'individual' | 'team' | 'both';
  minTeamSize?: number;
  maxTeamSize?: number;
  requiresApproval?: boolean;
  customFormFields?: EventFormField[];
  isRegistrationClosed?: boolean;
  visitorAccess?: VisitorAccessType;
  participantCategories?: ParticipantCategoryConfig[];
  isPaid?: boolean;
  baseFee?: number;
  topics?: string[];
  organizerWhatsApp?: string;
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

export interface RegistrationFormTemplate {
  id: string;
  organizationId: string; // or 'default'
  name: string;
  description?: string;
  fields: EventFormField[];
  isDefault?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  institution?: string;
  studentId?: string;
  role?: string;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'free';

export type PaymentStatus = 'not_required' | 'pending' | 'completed' | 'paid' | 'failed' | 'free';

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
  studentPhotoURL?: string;
  classGrade?: string;
  participantCategory?: string;
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
  // Payment and Fees
  appliedFee?: number;
  currency?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentTransactionId?: string;
  paymentReference?: string;
  paidAt?: string;
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
  studentPhotoURL?: string;
  classGrade?: string;
  participantCategory?: string;
  appliedFee?: number;
  currency?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentTransactionId?: string;
  paymentReference?: string;
  paidAt?: string;
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

export interface StudentNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  eventId?: string;
  festId?: string;
  actionUrl?: string;
  category?: string;
  read: boolean;
  createdAt: string;
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRoleType;
  loading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  hasPendingOrgRequest: boolean;
  signInWithGoogle: () => Promise<any>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithGoogleDemo: () => Promise<any>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<any>;
  signOutUser: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}
