# VS Code Development Setup

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Google OAuth credentials

## Setup Steps

### 1. Clone/Download Project
```bash
git clone <your-repository>
cd clubify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create `.env` file in project root:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=your_random_session_secret_key
```

### 4. Update Google OAuth Settings
In Google Cloud Console, add this callback URL:
```
http://localhost:5000/api/auth/google/callback
```

### 5. Run Development Server
```bash
npm run dev
```

The app will run on `http://localhost:5000`

## VS Code Extensions (Recommended)
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

## File Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
├── server/          # Express backend
│   ├── index.ts     # Server entry
│   ├── routes.ts    # API routes
│   ├── googleAuth.ts # Authentication
│   └── storage.ts   # Database layer
├── shared/          # Shared types
└── package.json
```

## Debugging in VS Code
1. Install the "JavaScript Debugger" extension
2. Add launch configuration in `.vscode/launch.json`
3. Set breakpoints and debug both frontend and backend

## Environment Variables
- Development uses `http://localhost:5000`
- Production needs full domain URL in `GOOGLE_CALLBACK_URL`
- MongoDB connection string required for data persistence