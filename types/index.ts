import {
  Role,
  OrgStatus,
  SubscriptionStatus,
  PlatformPlanName,
  ClientGoal,
  ClientStatus,
  FormVideoStatus,
  NotificationType,
  PaymentStatus,
  PlanInterval,
  InviteRole,
} from "@prisma/client";

export type {
  Role,
  OrgStatus,
  SubscriptionStatus,
  PlatformPlanName,
  ClientGoal,
  ClientStatus,
  FormVideoStatus,
  NotificationType,
  PaymentStatus,
  PlanInterval,
  InviteRole,
};

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
  avatar: string | null;
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface OrgWithStats {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  status: OrgStatus;
  trialEndsAt: Date | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: PlatformPlanName;
  maxTrainers: number;
  maxClients: number;
  createdAt: Date;
  _count: {
    users: number;
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserWithProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  organizationId: string | null;
  isActive: boolean;
  createdAt: Date;
  trainerProfile: {
    id: string;
    bio: string | null;
    specializations: string[];
    salary: number | null;
    joinedAt: Date;
  } | null;
  clientProfile: {
    id: string;
    assignedTrainerId: string | null;
    goal: ClientGoal | null;
    startWeight: number | null;
    currentWeight: number | null;
    targetWeight: number | null;
    height: number | null;
    startDate: Date | null;
    status: ClientStatus;
  } | null;
}

// ─── Check-in ─────────────────────────────────────────────────────────────────

export interface CheckInData {
  id: string;
  clientId: string;
  trainerId: string | null;
  date: Date;
  weight: number | null;
  energyLevel: number | null;
  sleepHours: number | null;
  dietAdherence: number | null;
  clientNotes: string | null;
  trainerNotes: string | null;
  createdAt: Date;
  client: { name: string; avatar: string | null };
  trainer: { name: string } | null;
}

// ─── Workout ──────────────────────────────────────────────────────────────────

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g. "8-12" or "12"
  rest: number; // seconds
  videoUrl?: string;
  notes?: string;
}

export interface WorkoutDayData {
  id: string;
  programId: string;
  dayNumber: number;
  title: string;
  exercises: Exercise[];
}

export interface WorkoutProgramWithDays {
  id: string;
  trainerId: string;
  clientId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  days: WorkoutDayData[];
  trainer: { name: string };
  client: { name: string };
}

// ─── Video ────────────────────────────────────────────────────────────────────

export interface FormVideoWithUsers {
  id: string;
  clientId: string;
  trainerId: string | null;
  s3Url: string;
  thumbnailUrl: string | null;
  exerciseName: string;
  description: string | null;
  uploadedAt: Date;
  status: FormVideoStatus;
  trainerFeedback: string | null;
  feedbackAt: Date | null;
  client: { name: string; avatar: string | null };
  trainer: { name: string } | null;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface MessageData {
  id: string;
  senderId: string;
  receiverId: string;
  organizationId: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
  sender: { name: string; avatar: string | null };
  receiver: { name: string; avatar: string | null };
}

export interface ConversationSummary {
  userId: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: Date;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface ClientPaymentData {
  id: string;
  clientId: string;
  organizationId: string;
  stripePaymentIntentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  planName: string | null;
  createdAt: Date;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ProgressMeasurementData {
  id: string;
  clientId: string;
  date: Date;
  weight: number | null;
  waist: number | null;
  chest: number | null;
  arms: number | null;
  hips: number | null;
  thighs: number | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: Date;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Form Data ────────────────────────────────────────────────────────────────

export interface CreateOrgForm {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  plan: PlatformPlanName;
  adminName: string;
  adminEmail: string;
}

export interface CreateTrainerForm {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  specializations: string[];
  salary?: number;
}

export interface CreateClientForm {
  name: string;
  email: string;
  phone?: string;
  assignedTrainerId?: string;
  goal?: ClientGoal;
  planId?: string;
}

export interface CheckInForm {
  weight?: number;
  energyLevel?: number;
  sleepHours?: number;
  dietAdherence?: number;
  clientNotes?: string;
}

export interface OnboardingData {
  // Step 1: Personal
  name: string;
  phone?: string;
  // Step 2: Goals
  goal: ClientGoal;
  startWeight: number;
  targetWeight: number;
  height: number;
  // Step 3: Photos (optional)
  beforePhotoUrl?: string;
}
