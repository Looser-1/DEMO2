import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { mriService } from "./services/mriService";
import { doctorService } from "./services/doctorService";
import { uploadMRI, uploadProfile, handleUploadError } from "./middleware/upload";
import { 
  insertSymptomAnalysisSchema, 
  insertMriAnalysisSchema, 
  insertConsultationSchema,
  insertUserPreferencesSchema,
  insertChatMessageSchema
} from "@shared/schema";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ======================== AI SYMPTOM ANALYSIS ROUTES ========================
  app.post('/api/symptoms/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSymptomAnalysisSchema.parse({
        ...req.body,
        userId
      });

      const analysis = await aiService.analyzeSymptoms({
        symptoms: validatedData.symptoms,
        severity: validatedData.severity,
        duration: validatedData.duration,
        userId
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      res.status(500).json({ message: "Failed to analyze symptoms" });
    }
  });

  app.get('/api/symptoms/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const suggestions = await aiService.getSymptomSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting symptom suggestions:", error);
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  app.get('/api/symptoms/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await aiService.getAnalysisHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error getting symptom history:", error);
      res.status(500).json({ message: "Failed to get history" });
    }
  });

  app.get('/api/symptoms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const analysis = await aiService.getAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Check if user owns this analysis
      if (analysis.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error getting symptom analysis:", error);
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // ======================== MRI ANALYSIS ROUTES ========================
  app.post('/api/mri/analyze', isAuthenticated, uploadMRI, handleUploadError, async (req: any, res: any) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { analysisType } = req.body;
      if (!analysisType) {
        return res.status(400).json({ message: "Analysis type is required" });
      }

      const analysis = await mriService.analyzeMRI({
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        filePath: file.path,
        analysisType
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing MRI:", error);
      res.status(500).json({ message: "Failed to analyze MRI" });
    }
  });

  app.get('/api/mri/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await mriService.getMRIAnalysisHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error getting MRI history:", error);
      res.status(500).json({ message: "Failed to get history" });
    }
  });

  app.get('/api/mri/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const analysis = await mriService.getMRIAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Check if user owns this analysis
      if (analysis.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error getting MRI analysis:", error);
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // ======================== DOCTOR CONSULTATION ROUTES ========================
  app.get('/api/doctors', isAuthenticated, async (req: any, res) => {
    try {
      const specialization = req.query.specialization as string;
      const doctors = await doctorService.getAvailableDoctors(specialization);
      res.json(doctors);
    } catch (error) {
      console.error("Error getting doctors:", error);
      res.status(500).json({ message: "Failed to get doctors" });
    }
  });

  app.post('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const patientId = req.user.claims.sub;
      const validatedData = insertConsultationSchema.parse({
        ...req.body,
        patientId
      });

      const consultation = await doctorService.scheduleConsultation({
        patientId,
        doctorId: validatedData.doctorId,
        scheduledAt: new Date(validatedData.scheduledAt!),
        notes: validatedData.notes || undefined
      });

      res.json(consultation);
    } catch (error) {
      console.error("Error scheduling consultation:", error);
      res.status(500).json({ message: "Failed to schedule consultation" });
    }
  });

  app.get('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let consultations;
      if (user?.role === 'doctor') {
        consultations = await doctorService.getDoctorConsultations(userId);
      } else {
        consultations = await doctorService.getPatientConsultations(userId);
      }

      res.json(consultations);
    } catch (error) {
      console.error("Error getting consultations:", error);
      res.status(500).json({ message: "Failed to get consultations" });
    }
  });

  app.get('/api/consultations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const consultation = await doctorService.getConsultationById(id);
      
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      // Check if user is involved in this consultation
      const userId = req.user.claims.sub;
      if (consultation.patientId !== userId && consultation.doctorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(consultation);
    } catch (error) {
      console.error("Error getting consultation:", error);
      res.status(500).json({ message: "Failed to get consultation" });
    }
  });

  app.post('/api/consultations/:id/start', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await doctorService.startConsultation(id);
      res.json(session);
    } catch (error) {
      console.error("Error starting consultation:", error);
      res.status(500).json({ message: "Failed to start consultation" });
    }
  });

  app.post('/api/consultations/:id/end', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const consultation = await doctorService.endConsultation(id, notes);
      res.json(consultation);
    } catch (error) {
      console.error("Error ending consultation:", error);
      res.status(500).json({ message: "Failed to end consultation" });
    }
  });

  // ======================== MEDICAL REPORTS ROUTES ========================
  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getMedicalReportsByUser(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ message: "Failed to get reports" });
    }
  });

  app.post('/api/reports/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reportType, title } = req.body;
      
      // Mock report generation
      const reportContent = {
        generatedAt: new Date().toISOString(),
        userId,
        reportType,
        data: {
          summary: "Health analysis report generated successfully",
          period: "Last 30 days",
          analyses: await storage.getSymptomAnalysesByUser(userId),
          mriScans: await storage.getMriAnalysesByUser(userId),
          consultations: await storage.getConsultationsByPatient(userId)
        }
      };

      const report = await storage.createMedicalReport({
        userId,
        reportType,
        title,
        content: reportContent,
        filePath: null
      });

      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // ======================== USER PREFERENCES ROUTES ========================
  app.get('/api/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error getting preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  app.post('/api/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId
      });

      const preferences = await storage.upsertUserPreferences(validatedData);
      res.json(preferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  // ======================== CHAT SUPPORT ROUTES ========================
  app.post('/api/chat/message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.body.conversationId || randomUUID();
      
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        userId,
        conversationId
      });

      const message = await storage.createChatMessage(validatedData);
      
      // Simulate bot response
      if (validatedData.sender === 'user') {
        setTimeout(async () => {
          await storage.createChatMessage({
            userId,
            conversationId,
            message: "Thank you for your message. Our support team will get back to you shortly.",
            sender: 'bot'
          });
        }, 1000);
      }

      res.json(message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/chat/conversation/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getChatMessagesByConversation(id);
      res.json(messages);
    } catch (error) {
      console.error("Error getting chat messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // ======================== DASHBOARD STATS ROUTES ========================
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'doctor') {
        // Doctor stats
        const consultations = await storage.getConsultationsByDoctor(userId);
        const activePatients = new Set(consultations.map(c => c.patientId)).size;
        const pendingReviews = consultations.filter(c => c.status === 'scheduled').length;
        
        res.json({
          totalAnalyses: consultations.length,
          activePatients,
          accuracyRate: 96.8,
          pendingReviews
        });
      } else {
        // Patient stats
        const [symptomAnalyses, mriAnalyses, consultations] = await Promise.all([
          storage.getSymptomAnalysesByUser(userId),
          storage.getMriAnalysesByUser(userId),
          storage.getConsultationsByPatient(userId)
        ]);
        
        const totalAnalyses = symptomAnalyses.length + mriAnalyses.length;
        const activeConsultations = consultations.filter(c => c.status === 'scheduled' || c.status === 'ongoing').length;
        
        res.json({
          totalAnalyses,
          activeConsultations,
          completedConsultations: consultations.filter(c => c.status === 'completed').length,
          recentAnalyses: symptomAnalyses.slice(0, 5)
        });
      }
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // ======================== HTML ROUTING ========================
  // Serve static HTML files with authentication checks
  app.get('/', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      // If authenticated, serve the dashboard
      res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
    } else {
      // If not authenticated, serve the landing page
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
  });

  app.get('/profile', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.sendFile(path.join(__dirname, '..', 'public', 'profile.html'));
    } else {
      res.redirect('/api/login');
    }
  });

  app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
    } else {
      res.redirect('/api/login');
    }
  });

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // ======================== WEBSOCKET SERVER ========================
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join_consultation':
            // Handle joining a consultation room
            ws.send(JSON.stringify({
              type: 'consultation_joined',
              consultationId: data.consultationId
            }));
            break;
            
          case 'consultation_message':
            // Handle consultation chat messages
            // Broadcast to other participants
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'consultation_message',
                  message: data.message,
                  sender: data.sender
                }));
              }
            });
            break;
            
          case 'video_signal':
            // Handle WebRTC signaling
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'video_signal',
                  signal: data.signal
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
