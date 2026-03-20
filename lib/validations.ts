import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const setupAccountSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Organization ─────────────────────────────────────────────────────────────

export const createOrgSchema = z.object({
  name: z.string().min(2, "Org name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(["STARTER", "GROWTH", "PRO"]),
  adminName: z.string().min(2, "Admin name required"),
  adminEmail: z.string().email("Invalid admin email"),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["PENDING", "ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"]).optional(),
  subscriptionPlan: z.enum(["STARTER", "GROWTH", "PRO"]).optional(),
});

// ─── Trainer ──────────────────────────────────────────────────────────────────

export const createTrainerSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specializations: z.array(z.string()).default([]),
  salary: z.number().positive().optional(),
});

// ─── Client ───────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  goal: z
    .enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "TRANSFORMATION", "FITNESS"])
    .optional(),
  planId: z.string().optional(),
});

// ─── Check-in ─────────────────────────────────────────────────────────────────

export const checkInSchema = z.object({
  weight: z.number().positive().optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  dietAdherence: z.number().int().min(1).max(10).optional(),
  clientNotes: z.string().max(1000).optional(),
});

export const trainerCheckInNotesSchema = z.object({
  trainerNotes: z.string().max(1000),
});

// ─── Workout Program ──────────────────────────────────────────────────────────

export const exerciseSchema = z.object({
  name: z.string().min(1, "Exercise name required"),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  rest: z.number().int().min(0),
  videoUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const workoutDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1, "Day title required"),
  exercises: z.array(exerciseSchema),
});

export const createProgramSchema = z.object({
  clientId: z.string(),
  title: z.string().min(2, "Program title required"),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  days: z.array(workoutDaySchema),
});

// ─── Video ────────────────────────────────────────────────────────────────────

export const videoUploadSchema = z.object({
  exerciseName: z.string().min(1, "Exercise name required"),
  description: z.string().optional(),
  fileName: z.string(),
  fileType: z.string().regex(/^video\//, "Must be a video file"),
});

export const videoFeedbackSchema = z.object({
  feedback: z.string().min(1, "Feedback is required"),
});

// ─── Progress ─────────────────────────────────────────────────────────────────

export const progressMeasurementSchema = z.object({
  date: z.string(),
  weight: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  arms: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  thighs: z.number().positive().optional(),
  notes: z.string().optional(),
});

// ─── Plans ────────────────────────────────────────────────────────────────────

export const createOrgPlanSchema = z.object({
  name: z.string().min(2),
  price: z.number().int().positive(), // in cents
  interval: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  features: z.array(z.string()).default([]),
});

// ─── Message ──────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
});

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const onboardingStep1Schema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
});

export const onboardingStep2Schema = z.object({
  goal: z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "TRANSFORMATION", "FITNESS"]),
  startWeight: z.number().positive("Weight must be positive"),
  targetWeight: z.number().positive("Target weight must be positive"),
  height: z.number().positive("Height must be positive"),
});
