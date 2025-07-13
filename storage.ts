import {
  users,
  symptomAnalyses,
  mriAnalyses,
  consultations,
  medicalReports,
  userPreferences,
  chatMessages,
  type User,
  type UpsertUser,
  type SymptomAnalysis,
  type InsertSymptomAnalysis,
  type MriAnalysis,
  type InsertMriAnalysis,
  type Consultation,
  type InsertConsultation,
  type MedicalReport,
  type InsertMedicalReport,
  type UserPreferences,
  type InsertUserPreferences,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Symptom analysis operations
  createSymptomAnalysis(analysis: InsertSymptomAnalysis): Promise<SymptomAnalysis>;
  getSymptomAnalysesByUser(userId: string): Promise<SymptomAnalysis[]>;
  getSymptomAnalysisById(id: string): Promise<SymptomAnalysis | undefined>;
  
  // MRI analysis operations
  createMriAnalysis(analysis: InsertMriAnalysis): Promise<MriAnalysis>;
  getMriAnalysesByUser(userId: string): Promise<MriAnalysis[]>;
  getMriAnalysisById(id: string): Promise<MriAnalysis | undefined>;
  
  // Consultation operations
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultationsByPatient(patientId: string): Promise<Consultation[]>;
  getConsultationsByDoctor(doctorId: string): Promise<Consultation[]>;
  getConsultationById(id: string): Promise<Consultation | undefined>;
  updateConsultationStatus(id: string, status: string, notes?: string): Promise<Consultation>;
  
  // Medical report operations
  createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport>;
  getMedicalReportsByUser(userId: string): Promise<MedicalReport[]>;
  getMedicalReportById(id: string): Promise<MedicalReport | undefined>;
  
  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByConversation(conversationId: string): Promise<ChatMessage[]>;
  getChatMessagesByUser(userId: string): Promise<ChatMessage[]>;
  
  // Search operations
  searchDiseases(query: string): Promise<string[]>;
  getAvailableDoctors(specialization?: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          status: userData.status,
          specialization: userData.specialization,
          licenseNumber: userData.licenseNumber,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Symptom analysis operations
  async createSymptomAnalysis(analysis: InsertSymptomAnalysis): Promise<SymptomAnalysis> {
    const [created] = await db
      .insert(symptomAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getSymptomAnalysesByUser(userId: string): Promise<SymptomAnalysis[]> {
    return await db
      .select()
      .from(symptomAnalyses)
      .where(eq(symptomAnalyses.userId, userId))
      .orderBy(desc(symptomAnalyses.createdAt));
  }

  async getSymptomAnalysisById(id: string): Promise<SymptomAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(symptomAnalyses)
      .where(eq(symptomAnalyses.id, id));
    return analysis;
  }

  // MRI analysis operations
  async createMriAnalysis(analysis: InsertMriAnalysis): Promise<MriAnalysis> {
    const [created] = await db
      .insert(mriAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getMriAnalysesByUser(userId: string): Promise<MriAnalysis[]> {
    return await db
      .select()
      .from(mriAnalyses)
      .where(eq(mriAnalyses.userId, userId))
      .orderBy(desc(mriAnalyses.createdAt));
  }

  async getMriAnalysisById(id: string): Promise<MriAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(mriAnalyses)
      .where(eq(mriAnalyses.id, id));
    return analysis;
  }

  // Consultation operations
  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [created] = await db
      .insert(consultations)
      .values(consultation)
      .returning();
    return created;
  }

  async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.createdAt));
  }

  async getConsultationsByDoctor(doctorId: string): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId))
      .orderBy(desc(consultations.createdAt));
  }

  async getConsultationById(id: string): Promise<Consultation | undefined> {
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, id));
    return consultation;
  }

  async updateConsultationStatus(id: string, status: string, notes?: string): Promise<Consultation> {
    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === "ongoing") updateData.startedAt = new Date();
    if (status === "completed") updateData.endedAt = new Date();

    const [updated] = await db
      .update(consultations)
      .set(updateData)
      .where(eq(consultations.id, id))
      .returning();
    return updated;
  }

  // Medical report operations
  async createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport> {
    const [created] = await db
      .insert(medicalReports)
      .values(report)
      .returning();
    return created;
  }

  async getMedicalReportsByUser(userId: string): Promise<MedicalReport[]> {
    return await db
      .select()
      .from(medicalReports)
      .where(eq(medicalReports.userId, userId))
      .orderBy(desc(medicalReports.generatedAt));
  }

  async getMedicalReportById(id: string): Promise<MedicalReport | undefined> {
    const [report] = await db
      .select()
      .from(medicalReports)
      .where(eq(medicalReports.id, id));
    return report;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [upserted] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return created;
  }

  async getChatMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async getChatMessagesByUser(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt));
  }

  // Search operations
  async searchDiseases(query: string): Promise<string[]> {
    // This is a basic implementation - in production, you'd use a medical database
    const diseaseList = [
      "Chest pain, shortness of breath",
      "Persistent cough, fever",
      "Migraine, headache",
      "Diabetes, high blood sugar",
      "Hypertension, high blood pressure",
      "Asthma, breathing difficulties",
      "Pneumonia, lung infection",
      "Bronchitis, chest congestion",
      "Allergic reaction, skin rash",
      "Gastritis, stomach pain",
      "Arthritis, joint pain",
      "Insomnia, sleep disorders",
      "Anxiety, panic attacks",
      "Depression, mood disorders",
      "Flu, viral infection",
    ];
    
    return diseaseList.filter(disease => 
      disease.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
  }

  async getAvailableDoctors(specialization?: string): Promise<User[]> {
    const baseConditions = [
      eq(users.role, "doctor"),
      eq(users.status, "active")
    ];

    if (specialization) {
      baseConditions.push(eq(users.specialization, specialization));
    }

    return await db.select().from(users).where(and(...baseConditions));
  }
}

export const storage = new DatabaseStorage();
