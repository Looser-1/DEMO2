import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["patient", "doctor", "admin"]);

// User status enum
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("patient").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  specialization: varchar("specialization"), // For doctors
  licenseNumber: varchar("license_number"), // For doctors
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Symptom analyses table
export const symptomAnalyses = pgTable("symptom_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  symptoms: text("symptoms").notNull(),
  severity: varchar("severity").notNull(), // mild, moderate, severe
  duration: varchar("duration").notNull(),
  aiPrediction: jsonb("ai_prediction").notNull(),
  confidence: real("confidence").notNull(),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// MRI analyses table
export const mriAnalyses = pgTable("mri_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  analysisType: varchar("analysis_type").notNull(), // tumor, stroke, etc.
  aiResults: jsonb("ai_results").notNull(),
  scanQuality: varchar("scan_quality"),
  anomalyDetected: boolean("anomaly_detected").default(false),
  processingTime: real("processing_time"),
  reportPath: varchar("report_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctor consultations table
export const consultations = pgTable("consultations", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("scheduled"), // scheduled, ongoing, completed, cancelled
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in minutes
  notes: text("notes"),
  prescription: text("prescription"),
  followUpRequired: boolean("follow_up_required").default(false),
  meetingUrl: varchar("meeting_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medical reports table
export const medicalReports = pgTable("medical_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  reportType: varchar("report_type").notNull(), // health_summary, mri_analysis, consultation
  title: varchar("title").notNull(),
  content: jsonb("content").notNull(),
  filePath: varchar("file_path"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(true),
  marketingCommunications: boolean("marketing_communications").default(false),
  dataSharing: boolean("data_sharing").default(true),
  dataExport: boolean("data_export").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table for support
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  sender: varchar("sender").notNull(), // user, bot, support
  conversationId: uuid("conversation_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  symptomAnalyses: many(symptomAnalyses),
  mriAnalyses: many(mriAnalyses),
  patientConsultations: many(consultations, { relationName: "patientConsultations" }),
  doctorConsultations: many(consultations, { relationName: "doctorConsultations" }),
  medicalReports: many(medicalReports),
  userPreferences: one(userPreferences),
  chatMessages: many(chatMessages),
}));

export const symptomAnalysesRelations = relations(symptomAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [symptomAnalyses.userId],
    references: [users.id],
  }),
}));

export const mriAnalysesRelations = relations(mriAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [mriAnalyses.userId],
    references: [users.id],
  }),
}));

export const consultationsRelations = relations(consultations, ({ one }) => ({
  patient: one(users, {
    fields: [consultations.patientId],
    references: [users.id],
    relationName: "patientConsultations",
  }),
  doctor: one(users, {
    fields: [consultations.doctorId],
    references: [users.id],
    relationName: "doctorConsultations",
  }),
}));

export const medicalReportsRelations = relations(medicalReports, ({ one }) => ({
  user: one(users, {
    fields: [medicalReports.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSymptomAnalysisSchema = createInsertSchema(symptomAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertMriAnalysisSchema = createInsertSchema(mriAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalReportSchema = createInsertSchema(medicalReports).omit({
  id: true,
  generatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SymptomAnalysis = typeof symptomAnalyses.$inferSelect;
export type InsertSymptomAnalysis = z.infer<typeof insertSymptomAnalysisSchema>;
export type MriAnalysis = typeof mriAnalyses.$inferSelect;
export type InsertMriAnalysis = z.infer<typeof insertMriAnalysisSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type MedicalReport = typeof medicalReports.$inferSelect;
export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
