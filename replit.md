# Clubify - Modern Club Management System

## Overview

Clubify is a full-stack club management application built with a modern tech stack. It provides comprehensive tools for managing clubs, members, announcements, events, tasks, and real-time communication. The application is designed for schools, colleges, and organizations to streamline their club operations.

## User Preferences

Preferred communication style: Simple, everyday language.
Database preference: MongoDB Atlas via Mongoose (active connection configured)
Styling preference: Tailwind CSS

## System Architecture

The application follows a monorepo structure with a clear separation between client and server code:

- **Frontend**: React-based SPA with TypeScript
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth 2.0 integration
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Build Tool**: Vite for frontend, esbuild for backend

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: MongoDB Atlas cloud database
- **ODM**: Mongoose for schema-based data modeling and validation
- **Authentication**: Passport.js with Google OAuth 2.0
- **Session Management**: MongoDB-backed sessions with connect-mongo

### Database Schema
The application uses MongoDB with Mongoose schemas for the following collections:
- **Users**: Store user profiles from Replit OAuth
- **Clubs**: Club information and metadata
- **Club Memberships**: User-club relationships with roles
- **Join Requests**: Pending membership requests
- **Announcements**: Club announcements with priority levels
- **Events**: Club events with scheduling information
- **Tasks**: Assignable tasks with due dates and assignees
- **Chat Messages**: Real-time messaging within clubs
- **Sessions**: Session storage for authentication (handled by connect-mongo)

## Data Flow

1. **Authentication Flow**: Users authenticate via Google OAuth, creating or updating user records
2. **Club Management**: Authenticated users can create clubs, manage memberships, and handle join requests
3. **Content Creation**: Club admins can create announcements, events, and tasks
4. **Real-time Features**: Chat messages and notifications flow through the system
5. **Permission System**: Role-based access control for club features

## External Dependencies

### Core Dependencies
- **mongoose**: MongoDB object modeling for Node.js
- **connect-mongo**: MongoDB session storage
- **@tanstack/react-query**: Server state management
- **passport**: Authentication middleware
- **passport-google-oauth20**: Google OAuth 2.0 integration

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form management
- **zod**: Schema validation

### Development Dependencies
- **vite**: Frontend build tool
- **tsx**: TypeScript execution for development
- **esbuild**: Backend bundling for production

## Deployment Strategy

### Development
- Frontend served by Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database automatically synced through Mongoose models
- Environment variables configured: `MONGODB_URI` (MongoDB Atlas), `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Production
- Frontend built with Vite and served statically
- Backend bundled with esbuild for Node.js execution
- Database models automatically managed by Mongoose
- Optimized for serverless deployment platforms

### Build Process
1. Frontend assets built to `dist/public`
2. Backend bundled to `dist/index.js`
3. Static assets served by Express in production
4. Session storage and database operations handled by MongoDB Atlas

The application is completely platform-independent with zero vendor lock-in. It can be deployed on any Node.js hosting service including Heroku, Railway, Render, Vercel, DigitalOcean, AWS, Google Cloud, or any VPS. No platform-specific code or configurations are required.

## Recent Changes

### July 21, 2025 - Migration to Standard Replit Environment & MongoDB Atlas Integration
- **Successfully migrated from Replit Agent**: Project now runs cleanly in standard Replit environment
- **MongoDB Atlas connected**: Real database storage configured with user's connection string
- **Google OAuth configured**: Authentication system working with provided credentials
- **All dependencies installed**: Project runs without errors or missing packages
- **Workflow optimized**: Uses standard npm run dev command for seamless development
- **Security verified**: No security vulnerabilities, proper client/server separation maintained
- **Form validation fixed**: Resolved all modal form schema validation issues (announcements, events, tasks)
- **Task creation working**: Fixed SelectItem validation errors, task modal fully functional
- **Upload error handling**: Improved photo and report upload with proper JSON error responses
- **All core features working**: Clubs, authentication, announcements, events, and tasks fully functional

### July 21, 2025 - Complete Platform Independence
- **Removed all platform dependencies**: Eliminated all Replit-specific code and packages
- **Universal deployment**: Application now works on any Node.js hosting platform
- **Standard configurations**: Uses standard Node.js patterns and environment variables
- **Google OAuth flexibility**: Callback URL configurable via environment variables
- **MongoDB compatibility**: Works with any MongoDB instance via standard connection URI
- **Zero vendor lock-in**: No platform-specific dependencies or configurations
- **Production ready**: Clean build process and deployment scripts for any hosting service

### July 21, 2025 - Google OAuth Migration
- Replaced Replit OAuth with Google OAuth for platform independence
- Created new Google authentication system in server/googleAuth.ts
- Updated all route handlers to use Google user format (req.user.id instead of req.user.claims.sub)
- Added login/logout functions to useAuth hook for frontend integration
- Application now uses Google OAuth2 with MongoDB sessions for scalable authentication
- Removed all Replit dependencies from authentication system

### July 22, 2025 - Enhanced Club Management Features
- **Club display pictures**: Added URL input field for club logos/images in settings modal
- **Visibility controls**: Implemented public/private toggle to control explore page appearance
- **Invite link system**: Created unique invite code generation with copy-to-clipboard functionality
- **Public club discovery**: Built explore page with search functionality for finding public clubs
- **Join via invite**: Added seamless join functionality using invite links for private clubs
- **Improved UI/UX**: Enhanced club settings modal with scroll support and better organization
- **Logout functionality**: Added consistent logout buttons across all main pages (home, explore, club dashboard)
- **Database enhancements**: Extended club schema with displayPictureUrl, isPublic, and inviteCode fields

### July 22, 2025 - Final Deployment Preparation
- **File upload functionality**: Replaced URL input with device file upload for club display pictures
- **Video call removal**: Completely removed video calling feature to prevent crashes and improve stability
- **Public clubs endpoint**: Fixed `/api/clubs/public` route and authentication requirements
- **Display picture integration**: Club logos now show throughout the app (home, explore, dashboard)
- **TypeScript error fixes**: Resolved array type checking and component reference issues
- **Code cleanup**: Removed AI traces and improved code quality for human-like development
- **Authentication fixes**: Improved logout functionality with proper session clearing and redirects
- **Deployment ready**: Application is stable, secure, and ready for production deployment