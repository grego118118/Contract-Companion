// Simplified auth mechanism that doesn't rely on Google OAuth

import session from "express-session";
import type { Express, RequestHandler, Request } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { randomUUID } from "crypto";

// Extend express-session with our custom properties
declare module 'express-session' {
  interface SessionData {
    user: any;
    isAuthenticated: boolean;
    returnTo?: string;
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

// Simple session setup
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "temp-session-secret-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax',
      maxAge: sessionTtl,
      path: '/'
    },
  });
}

// For demo purposes - create a demo user if they don't exist
async function getOrCreateDemoUser() {
  const demoUserId = 'demo-user-' + randomUUID().slice(0, 8);
  try {
    // Try to get an existing demo user
    const existingUser = await storage.getUser('demo-user');
    if (existingUser) {
      return existingUser;
    }
    
    // Create a new demo user
    const newUser = await storage.upsertUser({
      id: 'demo-user',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    });
    
    return newUser;
  } catch (error) {
    console.error("Error creating demo user:", error);
    // Fallback user object if DB operations fail
    return {
      id: 'demo-user',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    };
  }
}

// Simple authentication setup without external providers
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  const sessionMiddleware = getSession();
  app.use(sessionMiddleware);
  
  // Debug middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/login') || req.path.startsWith('/api/logout')) {
      console.log(`Auth debug (${req.path}):`);
      console.log('  Session ID:', req.sessionID);
      console.log('  User in session:', req.session.user ? 'Yes' : 'No');
    }
    next();
  });

  // Simple login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      // For demo purposes, log in automatically with a demo user
      const demoUser = await getOrCreateDemoUser();
      
      // Store user in session
      req.session.user = demoUser;
      req.session.isAuthenticated = true;
      
      console.log("User logged in:", demoUser);
      
      res.json({ 
        success: true, 
        user: demoUser 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Login failed due to server error" 
      });
    }
  });

  // Simple logout
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ success: false, message: "Logout failed" });
      }
      
      res.clearCookie('connect.sid', { path: '/' });
      console.log("User logged out, session destroyed");
      res.json({ success: true });
    });
  });

  // Check current user
  app.get("/api/auth/user", (req, res) => {
    if (req.session.isAuthenticated && req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // Simplified auto-login for testing
  app.get("/api/auto-login", async (req, res) => {
    try {
      // Auto-login with demo user
      const demoUser = await getOrCreateDemoUser();
      
      // Store user in session
      req.session.user = demoUser;
      req.session.isAuthenticated = true;
      
      console.log("Auto-login successful:", demoUser);
      
      // Redirect to home or dashboard
      res.redirect('/dashboard');
    } catch (error) {
      console.error("Auto-login error:", error);
      res.redirect('/');
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const publicPaths = [
    '/api/login',
    '/api/auto-login',
    '/api/auth/user',
    '/api/blog',
    '/api/create-checkout-session',
    '/api/subscription-plans',
    '/api/checkout',
    // Add any other public API endpoints here
  ];
  
  // Allow access to static assets, client-side routes, and non-API paths
  if (!req.path.startsWith('/api/') || 
      publicPaths.some(p => req.path.startsWith(p)) ||
      req.path === '/api/logout') {
    return next();
  }

  // Handle public pages explicitly if they are served via /api/*
  if (req.path.startsWith('/api/pricing') || 
      req.path.startsWith('/api/subscription')) {
    return next();
  }
  
  // Check if user is authenticated using our simplified session
  if (!req.session.isAuthenticated || !req.session.user) {
    console.log(`Access denied for ${req.path}. User not authenticated.`);
    // Store original URL for potential redirect after login
    req.session.returnTo = req.originalUrl;
    return res.status(401).json({ message: "Please log in to access this feature." });
  }
  
  console.log(`Access granted for ${req.path}. User:`, req.session.user.id);
  return next();
};
