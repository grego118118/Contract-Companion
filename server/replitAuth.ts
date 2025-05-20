import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    try {
      return await client.discovery(
        new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
        process.env.REPL_ID!
      );
    } catch (error) {
      console.error("Failed to get OIDC config:", error);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Create table if it doesn't exist
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Set up a more reliable session configuration
  return session({
    secret: process.env.SESSION_SECRET || "temp-session-secret-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: true, // Save uninitialized sessions to store returnTo
    rolling: true, // Forces the session identifier cookie to be set on every response
    cookie: {
      httpOnly: true,
      secure: false, // Set to false to allow non-HTTPS during development
      sameSite: 'lax',
      maxAge: sessionTtl,
      path: '/'
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // Ensure trust proxy is set correctly for secure cookies
  app.set("trust proxy", 1);
  
  // Set up session handling first
  const sessionMiddleware = getSession();
  app.use(sessionMiddleware);
  
  // Initialize passport after session is set up
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add debugging middleware to check session state
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
      console.log('Session debug - isAuthenticated:', req.isAuthenticated());
      console.log('Session debug - session ID:', req.sessionID);
      console.log('Session debug - user:', req.user);
    }
    next();
  });

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      // Get claims from tokens
      const claims = tokens.claims();
      console.log("User claims:", JSON.stringify(claims, null, 2));
      
      // Create a proper user object with necessary properties
      const user = {
        id: claims.sub,
        email: claims.email,
        firstName: claims.given_name || claims.name,
        lastName: claims.family_name,
        profileImageUrl: claims.picture,
        claims: claims
      };
      
      // Add tokens to the user session
      updateUserSession(user, tokens);
      
      // Save user to database
      await upsertUser(claims);
      
      // Return the user object to Passport
      verified(null, user);
    } catch (error) {
      console.error("Error in verify function:", error);
      verified(error as Error);
    }
  };

  // Extract the first domain to avoid having multiple strategies
  const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
  
  // Create just one strategy for the primary domain
  const strategy = new Strategy(
    {
      name: "replitauth",
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${domain}/api/callback`,
    },
    verify,
  );
  
  passport.use(strategy);

  // Configure how user data is saved in the session and retrieved later
  passport.serializeUser((user: Express.User, cb) => {
    console.log("Serializing user:", user);
    cb(null, user);
  });
  
  passport.deserializeUser((user: Express.User, cb) => {
    console.log("Deserializing user:", user);
    cb(null, user);
  });

  // Create super simple login and callback routes
  app.get("/api/login", (req, res, next) => {
    passport.authenticate("replitauth")(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("replitauth", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect('/');
      }
      
      if (!user) {
        console.error("No user returned from authentication:", info);
        return res.redirect('/');
      }
      
      // Log in the user
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect('/');
        }
        
        console.log("User successfully logged in:", user.id);
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Super simple authentication middleware - allow everything for now
  // This will let us debug the login issues without blocking access
  
  // Public routes that never need authentication
  const publicPaths = [
    '/api/login',
    '/api/callback',
    '/api/auth/user',
    '/api/blog',
    '/api/create-checkout-session'
  ];
  
  // Special handling for checkout and subscription pages
  if (req.path.includes('/checkout') || 
      req.path.includes('/subscription') || 
      req.path.includes('/pricing')) {
    return next();
  }
  
  // Allow all public paths
  if (publicPaths.includes(req.path) || 
      req.path.startsWith('/api/blog/') || 
      !req.path.startsWith('/api/')) {
    return next();
  }
  
  // For protected API routes, check authentication
  if (!req.isAuthenticated()) {
    // For API routes, return JSON error
    return res.status(401).json({ message: "Please log in to access this feature" });
  }
  
  // User is authenticated, proceed
  return next();
};
