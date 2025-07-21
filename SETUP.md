# Clubify Setup Guide

## Prerequisites

1. **Node.js 18+** installed on your system
2. **MongoDB Atlas** account and cluster
3. **Google Cloud Console** account for OAuth setup

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in `.env`:

### MongoDB Setup
- Create a MongoDB Atlas cluster at https://cloud.mongodb.com
- Get your connection string and add it to `MONGODB_URI`

### Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Google+ API" for your project
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - For development: `http://localhost:5000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

### Session Secret
Generate a random string for `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5000`

## VS Code Development

This application is fully independent and runs perfectly in VS Code:

1. Open the project folder in VS Code
2. Install the recommended extensions (TypeScript, ESLint)
3. Use the integrated terminal to run `npm run dev`
4. The app will be available at `http://localhost:5000`

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The application can be deployed to any Node.js hosting service like:
- Vercel
- Netlify
- Railway
- DigitalOcean App Platform
- AWS EC2
- Google Cloud Run

## Features

- ✅ Google OAuth authentication
- ✅ MongoDB database with Mongoose
- ✅ Real-time chat with Socket.IO
- ✅ Club management system
- ✅ Event scheduling
- ✅ Task management
- ✅ Announcement system
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript throughout

## No Replit Dependencies

This application has been fully converted from Replit-specific code to standard web technologies:

- **Authentication**: Google OAuth instead of Replit OAuth
- **Database**: MongoDB Atlas (cloud) instead of Replit DB
- **Deployment**: Any Node.js host instead of Replit only
- **Development**: Works in any IDE/editor, not just Replit

You can now develop and deploy this application anywhere!