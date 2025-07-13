# MediMind AI Health Platform

## Overview

MediMind is a comprehensive AI-powered health analysis platform that enables users to analyze symptoms, process MRI scans, and consult with healthcare professionals. The application provides advanced disease prediction capabilities with high accuracy rates and integrates seamlessly with medical professionals for comprehensive healthcare support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Key Design Decisions
- **Monorepo Structure**: Single repository with client, server, and shared directories
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Component-Based UI**: Modular React components with consistent design system
- **API-First Design**: RESTful API endpoints with proper error handling
- **Real-time Features**: WebSocket support for live consultations and chat

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions with 1-week TTL
- **User Management**: Complete user lifecycle with roles (patient, doctor, admin)
- **Security**: HTTP-only cookies with secure settings

### AI Analysis Services
- **Symptom Analysis**: AI-powered disease prediction with confidence scoring
- **MRI Processing**: Medical image analysis with anomaly detection
- **Mock AI Implementation**: Simulated AI responses for development (ready for real AI integration)

### Medical Consultation System
- **Doctor Discovery**: Search and filter available healthcare professionals
- **Appointment Scheduling**: Calendar-based consultation booking
- **Video Conferencing**: Integrated video call functionality
- **Chat System**: Real-time messaging between patients and doctors

### Dashboard Interface
- **Multi-Section Layout**: Dashboard, Doctors, History, Reports, Settings
- **Mobile-Responsive**: Adaptive design for all screen sizes
- **Real-time Updates**: Live data synchronization across components
- **Interactive Components**: Rich UI elements for complex medical data

## Data Flow

### User Authentication Flow
1. User accesses application → Landing page displayed
2. User clicks "Sign In" → Redirected to Replit Auth
3. Successful authentication → User session created
4. User redirected to dashboard → Full application access

### Symptom Analysis Flow
1. User enters symptoms, severity, and duration
2. Data validated and sent to AI analysis service
3. Mock AI generates prediction with confidence score
4. Results stored in database and displayed to user
5. Analysis history maintained for future reference

### MRI Analysis Flow
1. User uploads MRI file (DICOM, JPEG, PNG, PDF)
2. File validated and stored securely
3. Analysis request sent to MRI processing service
4. Mock analysis generates findings and recommendations
5. Results stored and presented with detailed breakdown

### Consultation Flow
1. User browses available doctors by specialization
2. User selects doctor and preferred time slot
3. Consultation scheduled with meeting URL generated
4. Both parties receive notifications
5. Video call initiated at scheduled time

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **express**: Web server framework
- **multer**: File upload handling

### Development Dependencies
- **vite**: Frontend build tool and development server
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database schema management

### Authentication Dependencies
- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon Database connection for development
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPL_ID
- **File Storage**: Local uploads directory for development

### Production Build
- **Frontend**: Vite build to `dist/public` directory
- **Backend**: esbuild compilation to `dist/index.js`
- **Static Assets**: Served directly by Express in production
- **Database**: PostgreSQL with connection pooling

### Deployment Considerations
- **Database Migrations**: Drizzle Kit for schema changes
- **File Storage**: Local storage (ready for cloud provider integration)
- **Session Storage**: PostgreSQL-backed for scalability
- **Environment Configuration**: Production-ready environment variable management

### Performance Optimizations
- **Code Splitting**: Vite automatic code splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Automatic image and asset optimization
- **Database Indexing**: Proper indexing for query performance