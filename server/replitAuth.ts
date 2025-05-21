// IMPORTANT: Set the following environment variables for Google OAuth:
// GOOGLE_CLIENT_ID
// GOOGLE_CLIENT_SECRET

import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables are not set. Google OAuth will not function.");
}

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
    secret: process.env.SESSION_SECRET || "temp-session-secret-for-development-google",
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

// This function maps Google profile claims to the structure expected by storage.upsertUser
async function upsertUser(
  claims: {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }
) {
  await storage.upsertUser({
    id: claims.sub, // Google ID is used as 'sub'
    email: claims.email,
    firstName: claims.given_name, // Corresponds to 'first_name'
    lastName: claims.family_name,   // Corresponds to 'last_name'
    profileImageUrl: claims.picture, // Corresponds to 'profile_image_url'
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1); // Important for secure cookies if behind a proxy
  
  const sessionMiddleware = getSession();
  app.use(sessionMiddleware);
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/login') || req.path.startsWith('/api/logout')) {
      console.log(`Auth debug (${req.path}):`);
      console.log('  Session ID:', req.sessionID);
      console.log('  Authenticated:', req.isAuthenticated());
      console.log('  User:', req.user);
    }
    next();
  });

  const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
  const callbackURL = `https://${domain}/api/auth/google/callback`;
  console.log(`Using Google OAuth callback URL: ${callbackURL}`);

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: callbackURL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // console.log('Google profile:', JSON.stringify(profile, null, 2)); // For debugging
        const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : undefined;
        if (!userEmail) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        const claimsForDb = {
          sub: profile.id,
          email: userEmail,
          given_name: profile.name?.givenName,
          family_name: profile.name?.familyName,
          picture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined,
        };

        await upsertUser(claimsForDb);

        const user = {
          id: profile.id,
          email: userEmail,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          // Retain a claims-like structure on the user object for session consistency if needed elsewhere
          claims: claimsForDb 
        };
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  ));

  passport.serializeUser((user: Express.User, cb) => {
    console.log("Serializing user:", user);
    cb(null, user); // Store the whole user object in session
  });
  
  passport.deserializeUser((user: Express.User, cb) => {
    console.log("Deserializing user:", user);
    // Here, you might typically fetch the user from DB using user.id to ensure it's fresh
    // For now, just returning the session user object
    cb(null, user);
  });

  app.get("/api/login", passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get("/api/auth/google/callback", 
    passport.authenticate('google', { 
      failureRedirect: '/', 
      failureMessage: true // Will add error messages to req.session.messages
    }), 
    (req, res) => {
      // Successful authentication
      console.log("Google callback successful, user:", req.user);
      req.logIn(req.user!, (err) => { // req.user is populated by Passport
        if (err) {
          console.error("Login error after Google callback:", err);
          return res.redirect('/'); 
        }
        console.log("User successfully logged in via req.logIn, redirecting to /");
        // Check for returnTo URL if you implement it, otherwise redirect to home
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(returnTo);
      });
    }
  );

  app.get("/api/logout", (req, res, next) => {
    console.log("Logging out user:", req.user);
    req.logout((err) => {
      if (err) { 
        console.error("Logout error:", err);
        return next(err); 
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destruction error:", destroyErr);
          return next(destroyErr);
        }
        res.clearCookie('connect.sid', { path: '/' }); // Ensure session cookie is cleared
        console.log("User logged out, session destroyed, redirecting to /");
        res.redirect('/');
      });
    });
  });

  // Endpoint to check current user (useful for frontend)
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const publicPaths = [
    '/api/login',
    '/api/auth/google/callback', // Updated callback path
    '/api/auth/user',
    '/api/blog', // Assuming blog is public
    '/api/create-checkout-session', // Assuming this is part of a public flow
    // Add any other public API endpoints here
  ];
  
  // Allow access to static assets, client-side routes, and non-API paths
  if (!req.path.startsWith('/api/') || 
      publicPaths.some(p => req.path.startsWith(p)) ||
      req.path === '/api/logout') { // Logout should be accessible
    return next();
  }

  // Handle marketing/public pages explicitly if they are served via /api/* (unlikely)
  // For example, if /api/pricing-page is a public API endpoint
  if (req.path.startsWith('/api/pricing') || req.path.startsWith('/api/subscription-plans')) {
      return next();
  }
  
  if (!req.isAuthenticated()) {
    console.log(`Access denied for ${req.path}. User not authenticated.`);
    // Store original URL for redirect after login
    req.session.returnTo = req.originalUrl;
    return res.status(401).json({ message: "Please log in to access this feature." });
  }
  
  console.log(`Access granted for ${req.path}. User:`, req.user?.id);
  return next();
};
