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
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
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
  return session({
    secret: process.env.SESSION_SECRET || "temp-session-secret-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: true, // Save uninitialized sessions to store returnTo
    cookie: {
      httpOnly: true,
      secure: false, // Set to false to allow non-HTTPS during development
      sameSite: 'lax',
      maxAge: sessionTtl,
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
  app.set("trust proxy", 1);
  
  // Setup session
  const sessionMiddleware = getSession();
  app.use(sessionMiddleware);
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Get OpenID config
  const config = await getOidcConfig();
  
  // User verification function for Passport
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      // Create user object with tokens
      const user = {};
      updateUserSession(user, tokens);
      
      // Save user to database
      await upsertUser(tokens.claims());
      
      // Return verified user
      verified(null, user);
    } catch (error) {
      console.error("Error in verify function:", error);
      verified(error as Error);
    }
  };
  
  // Setup Replit authentication strategies for all domains
  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }
  
  // Serialize and deserialize user
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
  
  // Super simple login route
  app.get("/api/login", (req, res, next) => {
    // Use the simplest possible authentication flow
    passport.authenticate(`replitauth:${req.hostname}`)(req, res, next);
  });
  
  // Simple callback route
  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, (err: Error | null, user: Express.User | undefined, info: any) => {
      if (err || !user) {
        console.error("Authentication failed:", err);
        return res.redirect("/");
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/");
        }
        
        // Always redirect to home page
        return res.redirect("/");
      });
    })(req, res, next);
  });
  
  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Return to home page after logout
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
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
