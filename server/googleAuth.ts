// import * as client from "openid-client";
// import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; // Added
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
// import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// if (!process.env.REPLIT_DOMAINS) {
//   throw new Error("Environment variable REPLIT_DOMAINS not provided");
// }

// const getOidcConfig = memoize(
//   async () => {
//     try {
//       return await client.discovery(
//         new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
//         process.env.REPL_ID!
//       );
//     } catch (error) {
//       console.error("Failed to get OIDC config:", error);
//       throw error;
//     }
//   },
//   { maxAge: 3600 * 1000 }
// );

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
      secure: process.env.NODE_ENV === 'production', // Set dynamically
      sameSite: 'lax', // Consider 'strict' if appropriate and doesn't break OAuth redirects
      maxAge: sessionTtl,
      path: '/'
    },
  });
}

// function updateUserSession(
//   user: any,
//   tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
// ) {
//   user.claims = tokens.claims();
//   user.access_token = tokens.access_token;
//   user.refresh_token = tokens.refresh_token;
//   user.expires_at = user.claims?.exp;
// }

// async function upsertUser(
//   claims: any,
// ) {
//   await storage.upsertUser({
//     id: claims["sub"],
//     email: claims["email"],
//     firstName: claims["first_name"],
//     lastName: claims["last_name"],
//     profileImageUrl: claims["profile_image_url"],
//   });
// }

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
  // app.use((req, res, next) => {
  //   if (req.path.startsWith('/api/auth')) {
  //     console.log('Session debug - isAuthenticated:', req.isAuthenticated());
  //     console.log('Session debug - session ID:', req.sessionID);
  //     console.log('Session debug - user:', req.user);
  //   }
  //   next();
  // });

  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
      scope: ['profile', 'email'] // Ensure scope includes email and profile
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile Received:", JSON.stringify(profile, null, 2));
      try {
        // Extract necessary information from the profile
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        const firstName = profile.name && profile.name.givenName;
        const lastName = profile.name && profile.name.familyName;
        const profileImageUrl = profile.photos && profile.photos[0] && profile.photos[0].value;

        if (!email) {
          return done(new Error("Email not found in Google profile"), undefined);
        }

        // Upsert user into our database
        const user = await storage.upsertUser({
          googleId,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          profileImageUrl: profileImageUrl || undefined,
        });
        
        // Pass the user object (from our DB) to Passport
        return done(null, user);
      } catch (error) {
        console.error("Error in Google OAuth verify function:", error);
        return done(error as Error);
      }
    }
  ));

  // Configure how user data is saved in the session and retrieved later
  passport.serializeUser((user: any, done) => { // Changed type to any for now
    console.log("Serializing user:", user);
    // Store only the user ID in the session to keep it lightweight
    done(null, user.id); // Assuming user object has an 'id' field from our DB
  });
  
  passport.deserializeUser(async (id: string, done) => {
    console.log("Deserializing user ID:", id);
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, user);
      } else {
        // User not found in DB, which could happen if the user was deleted
        // from DB while their session was still active.
        done(null, false); // Indicate that deserialization failed
      }
    } catch (error) {
      console.error("Error in deserializeUser:", error);
      done(error);
    }
  });

  // Create improved login and callback routes with proper error handling
  // app.get("/api/login", (req, res, next) => {
  //   // Store the return URL in the session if provided
  //   if (req.query.returnTo) {
  //     req.session.returnTo = req.query.returnTo as string;
  //   }
    
  //   // Initiate authentication
  //   passport.authenticate("replitauth", {
  //     // Force the auth flow to always happen
  //     prompt: "login",
  //   })(req, res, next);
  // });

  // app.get("/api/callback", (req, res, next) => {
  //   passport.authenticate("replitauth", (err, user, info) => {
  //     if (err) {
  //       console.error("Authentication error:", err);
  //       return res.redirect('/?auth_error=server_error');
  //     }
      
  //     if (!user) {
  //       console.error("No user returned from authentication:", info);
  //       return res.redirect('/?auth_error=login_failed');
  //     }
      
  //     // Log in the user with a complete user session
  //     req.logIn(user, (loginErr) => {
  //       if (loginErr) {
  //         console.error("Login error:", loginErr);
  //         return res.redirect('/?auth_error=session_error');
  //       }
        
  //       console.log("User successfully logged in:", user.id);
        
  //       // Redirect to the stored return URL or default to home
  //       const returnTo = req.session.returnTo || '/';
  //       delete req.session.returnTo;
        
  //       return res.redirect(returnTo);
  //     });
  //   })(req, res, next);
  // });

  // app.get("/api/logout", (req, res) => {
  //   req.logout(() => {
  //     res.redirect('/');
  //   });
  // });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const publicApiPaths = [
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/logout',
    '/api/auth/user', // To check auth status
    '/api/health',
    '/api/blog', // Assuming blog is public
    '/api/create-checkout-session', // Assuming this can be initiated before login
    // Add any other specific public API endpoints like /api/pricing-plans etc.
  ];

  // Check if the path starts with /api/ and is NOT one of the publicApiPaths or a sub-path of them.
  if (req.path.startsWith('/api/') && 
      !publicApiPaths.some(publicPath => req.path.startsWith(publicPath))) {
    if (req.isAuthenticated()) {
      return next(); // User is authenticated, proceed to the protected API route
    } else {
      // User is not authenticated, send 401
      return res.status(401).json({ message: "User not authenticated" });
    }
  }
  
  // For non-API routes or public API routes, let the request through.
  // Non-API routes (e.g., serving frontend files) are typically handled 
  // by static file middleware or a catch-all route later in the stack.
  return next();
};
