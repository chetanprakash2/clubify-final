# Platform-Independent Deployment Guide

This application is completely platform-independent and can be deployed anywhere Node.js is supported.

## Environment Variables

Create these environment variables on your hosting platform:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
SESSION_SECRET=your_random_session_secret
PORT=5000
NODE_ENV=production
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain's callback URL to authorized redirect URIs:
   - Format: `https://your-domain.com/api/auth/google/callback`

## Deployment Platforms

### Heroku
```bash
git push heroku main
```

### Railway
```bash
railway up
```

### Render
- Connect your Git repository
- Set build command: `npm run build`
- Set start command: `npm start`

### Vercel
```bash
vercel --prod
```

### DigitalOcean App Platform
- Connect your Git repository
- Set build command: `npm run build`
- Set run command: `npm start`

### Generic VPS
```bash
npm install
npm run build
npm start
```

## Build Commands

- **Build**: `npm run build`
- **Start**: `npm start`
- **Development**: `npm run dev`

The application will automatically:
- Build frontend assets to `dist/public`
- Bundle backend to `dist/index.js`
- Serve everything on the PORT environment variable

## Zero Platform Dependencies

✅ No Replit-specific code
✅ No platform-specific configurations
✅ Standard Node.js application
✅ MongoDB connection via standard URI
✅ Environment variable based configuration
✅ Works on any hosting service