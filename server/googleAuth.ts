import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import MongoStore from "connect-mongo";
import type { Express, Request } from "express";
import { storage } from "./storage";

// User interface for authenticated requests
export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const mongoUrl = process.env.MONGODB_URI;
  
  let sessionStore = undefined;
  if (mongoUrl) {
    try {
      sessionStore = MongoStore.create({
        mongoUrl,
        touchAfter: 24 * 3600,
        ttl: sessionTtl / 1000,
        collectionName: 'user_sessions',
      });
      console.log('MongoDB session store initialized');
    } catch (error) {
      console.log('Warning: MongoDB session store failed, using memory store');
      sessionStore = undefined;
    }
  } else {
    console.log('Warning: No MONGODB_URI provided - using memory session store');
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  // Configure session middleware
  app.use(getSession());
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth strategy
  const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  
  if (hasGoogleCredentials) {
    // For development, use full URL. For production, use GOOGLE_CALLBACK_URL env var
    const baseUrl = process.env.NODE_ENV === 'development' && process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS}`
      : '';
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
    
    console.log(`Using callback URL: ${callbackURL}`);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userData = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value
        };
        
        const user = await storage.upsertUser(userData);
        return done(null, user);
      } catch (error) {
        console.error('Google auth error:', error);
        return done(error, false);
      }
    }));
    
    console.log('Google OAuth strategy configured successfully');
  } else {
    console.log('Warning: Google OAuth not configured - missing credentials');
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  });

  // Auth routes - only set up Google routes if credentials are available
  if (hasGoogleCredentials) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => {
        // Successful authentication, redirect to app
        res.redirect('/');
      }
    );

    app.get('/api/login', (req, res) => {
      res.redirect('/api/auth/google');
    });
  } else {
    // Development fallback routes when Google OAuth is not configured
    app.get('/api/auth/google', (req, res) => {
      res.status(500).json({ 
        message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
      });
    });

    app.get('/api/login', (req, res) => {
      res.status(500).json({ 
        message: 'Authentication not configured. Please set up Google OAuth credentials.' 
      });
    });
    
    // Dev login route for testing without OAuth
    app.post('/api/auth/dev-login', async (req, res) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Dev login only available in development' });
      }
      
      try {
        const testUser = {
          id: 'dev-user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          profileImageUrl: undefined
        };
        
        const user = await storage.upsertUser(testUser);
        req.login(user, (err) => {
          if (err) {
            console.error('Dev login error:', err);
            return res.status(500).json({ message: 'Login failed' });
          }
          res.json({ message: 'Logged in successfully', user });
        });
      } catch (error) {
        console.error('Dev login error:', error);
        res.status(500).json({ message: 'Login failed' });
      }
    });
  }

  // Logout routes
  const handleLogout = (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    });
  };

  app.get('/api/logout', handleLogout);
  app.get('/api/auth/logout', handleLogout);
  app.get('/api/auth/google/logout', handleLogout);

  // User info route
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}