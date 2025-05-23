import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport"; // Added for Google Auth routes
import { z } from "zod"; // Import Zod
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth"; // Changed import
import { analyzeContract, queryContract } from "./anthropic";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pdf from "pdf-parse"; // Added pdf-parse
import type { Request, Response } from "express";
import Stripe from "stripe";
import { checkSubscription } from "./middleware/subscriptionCheck";
import grievanceRoutes from './routes/grievanceRoutes'; // Import grievance router
import contractRoutes from './routes/contractRoutes'; // Import contract router

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any, // Cast to any to bypass type check
});

// Subscription pricing tiers in cents - must include correct number of cents
const SUBSCRIPTION_PRICES = {
  basic: 999,     // $9.99 per month
  standard: 1999, // $19.99 per month
  premium: 2999,  // $29.99 per month
};

// Subscription plan features
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    description: 'Perfect for individual union members',
    price: SUBSCRIPTION_PRICES.basic,
    features: {
      maxQueries: 20,
      maxContracts: 1,
      chatHistoryDays: 7,
      modelTier: 'basic'
    }
  },
  standard: {
    name: 'Standard',
    description: 'Perfect for active union members',
    price: SUBSCRIPTION_PRICES.standard,
    features: {
      maxQueries: 50,
      maxContracts: 3,
      chatHistoryDays: 30,
      modelTier: 'standard'
    }
  },
  premium: {
    name: 'Premium',
    description: 'Unlimited access for engaged members',
    price: SUBSCRIPTION_PRICES.premium,
    features: {
      maxQueries: -1, // unlimited
      maxContracts: -1, // unlimited
      chatHistoryDays: -1, // permanent
      modelTier: 'premium'
    }
  }
};

// Setup multer for file uploads
const upload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(import.meta.dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueFilename);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a plain login test route
  app.get('/api/login-test', (req, res) => {
    res.send('Login page - this is a test');
  });
  
  // System health monitoring endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const { getSystemHealth } = await import('./services/healthService');
      const healthData = await getSystemHealth();
      res.json(healthData);
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({ 
        error: 'Failed to fetch system health',
        services: [] 
      });
    }
  });
  
  // Auth middleware
  await setupAuth(app); // Make sure setupAuth is called

  // CSRF Token Endpoint - should be accessible to get the token
  app.get('/api/csrf-token', (req: any, res) => {
    if (typeof req.csrfToken === 'function') {
      res.json({ csrfToken: req.csrfToken() });
    } else {
      // This case might occur if CSRF middleware isn't correctly placed before this route's execution for some reason
      // or if the route is incorrectly exempted by an earlier middleware.
      console.error("Error: req.csrfToken() is not available on /api/csrf-token. Check middleware order.");
      res.status(500).json({ message: 'CSRF token not available.' });
    }
  });

  // Google Auth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed' }), // Redirect on failure
    (req, res) => {
      // Successful authentication
      console.log("Google auth callback successful, user:", req.user);
      // Redirect to a success page or the frontend
      const returnTo = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(returnTo);
    }
  );

  // Logout route
  app.get('/api/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      req.session.destroy((destroyErr) => { // Also destroy session
        if (destroyErr) {
          console.error("Error destroying session:", destroyErr);
          return next(destroyErr);
        }
        res.clearCookie('connect.sid', { path: '/' }); // Clear session cookie
        console.log("User logged out and session destroyed");
        res.redirect('/'); // Redirect to homepage after logout
      });
    });
  });
  
  // Auth routes (e.g., get current user)
  // This route is intentionally public, its response indicates auth state.
  app.get('/api/auth/user', async (req: any, res) => {
    if (req.isAuthenticated() && req.user) {
      // req.user should be the full user object from deserializeUser
      // We can re-fetch or assume req.user is fresh enough.
      // For robustness, especially if user details can change, re-fetching is safer.
      try {
        const userFromDb = await storage.getUser(req.user.id);
        if (userFromDb) {
          res.json({ user: userFromDb, isAuthenticated: true });
        } else {
          // This case might happen if user was deleted from DB during session
          req.logout((err) => { // Log out the user from session
            if (err) { console.error("Error during logout on user not found:", err); }
            res.json({ user: null, isAuthenticated: false, message: "User not found in database." });
          });
        }
      } catch (error) {
        console.error("Error fetching user in /api/auth/user:", error);
        res.status(500).json({ user: null, isAuthenticated: false, message: "Error fetching user data." });
      }
    } else {
      res.json({ user: null, isAuthenticated: false });
    }
  });

  // Mount Grievance Routes
  app.use('/api/grievances', grievanceRoutes);

  // Mount Contract Routes
  app.use('/api/contracts', contractRoutes);

  // Blog API
  
  // Get all blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  
  // Get featured blog posts for homepage
  app.get("/api/blog/featured", async (req, res) => {
    try {
      const posts = await storage.getFeaturedBlogPosts(3);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching featured blog posts:", error);
      res.status(500).json({ message: "Failed to fetch featured blog posts" });
    }
  });
  
  // Get a specific blog post
  app.get("/api/blog/:id", async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });
  
  // Get related posts for a blog post
  app.get("/api/blog/:id/related", async (req, res) => {
    try {
      const postId = req.params.id;
      const relatedPosts = await storage.getRelatedBlogPosts(postId, 2);
      res.json(relatedPosts);
    } catch (error) {
      console.error("Error fetching related blog posts:", error);
      res.status(500).json({ message: "Failed to fetch related blog posts" });
    }
  });

  // Subscription endpoints
  
  // Reset the trial period for a user (added for development purposes)
  app.post("/api/subscription/reset-trial", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // Changed to generic id
      
      // Set trial period for 7 days from now
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: "trial",
        trialEndsAt: trialEnd
      });
      
      res.json({
        status: "success",
        message: "Trial period has been reset to 7 days",
        trialEndsAt: trialEnd
      });
    } catch (error) {
      console.error("Error resetting trial period:", error);
      res.status(500).json({ message: "Failed to reset trial period" });
    }
  });

  // Get user subscription status
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If user doesn't have a subscription status yet, set them on a trial
      if (!user.subscriptionStatus) {
        // Set trial period for 7 days
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        
        await storage.updateUserSubscription(userId, {
          subscriptionStatus: "trial",
          trialEndsAt: trialEnd,
          planId: "standard" // Default to standard tier for trials
        });
        
        return res.json({
          status: "trial",
          trialEndsAt: trialEnd,
          daysLeft: 7,
          planId: "standard"
        });
      }
      
      // If the user is on a trial, check if the trial has expired
      if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
        const now = new Date();
        if (now > user.trialEndsAt) {
          // Trial has expired
          // Option: Update status in DB to 'expired' if desired, e.g.:
          // await storage.updateUserSubscription(userId, { subscriptionStatus: "expired" });
          // For now, just reflect in response:
          return res.json({
            status: "expired", // Clearly indicate trial is expired
            trialEndsAt: user.trialEndsAt,
            daysLeft: 0,
            planId: user.planId || "standard",
            message: "Your trial period has ended. Please subscribe to continue."
          });
        }
        
        // Trial is still active (existing logic for this part is fine)
        const daysLeft = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.json({
          status: "trial",
          trialEndsAt: user.trialEndsAt,
          daysLeft: daysLeft,
          planId: user.planId || "standard"
        });
      }
      
      // If user has an active subscription
      if (user.subscriptionStatus === "active" && user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Get plan details
          let planId = user.planId || "standard";
          
          // If subscription has metadata with plan info, use that
          if (subscription.metadata && subscription.metadata.planId) {
            planId = subscription.metadata.planId as string;
          }
          
          return res.json({
            status: "active",
            subscriptionId: subscription.id,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            planId: planId
          });
        } catch (err: any) {
          console.error("Error fetching Stripe subscription:", err);
          return res.json({
            status: user.subscriptionStatus,
            planId: user.planId || "standard",
            error: "Could not verify subscription status"
          });
        }
      }
      
      // Default response
      return res.json({
        status: user.subscriptionStatus || "unknown",
        planId: user.planId || "standard"
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Failed to check subscription status" });
    }
  });
  
  // Start a subscription
  app.post("/api/subscription", isAuthenticated, async (req: any, res) => {
    const subscriptionPlanSchema = z.object({ plan: z.enum(['basic', 'standard', 'premium']).optional() });
    try {
      const validationResult = subscriptionPlanSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid plan data.', errors: validationResult.error.flatten().fieldErrors });
      }
      const validatedPlan = validationResult.data.plan;

      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If user already has a subscription
      if (user.subscriptionStatus === "active" && user.stripeSubscriptionId) {
        return res.status(400).json({ message: "User already has an active subscription" });
      }
      
      // Get the requested plan (default to standard)
      const planId = (validatedPlan || 'standard') as keyof typeof SUBSCRIPTION_PLANS; // Use validatedPlan
      if (!SUBSCRIPTION_PLANS[planId]) {
        // This check might seem redundant if z.enum covers all valid plans,
        // but good for defense in depth or if SUBSCRIPTION_PLANS keys change.
        return res.status(400).json({ message: "Invalid subscription plan key." });
      }
      
      const plan = SUBSCRIPTION_PLANS[planId];
      
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          metadata: {
            userId: user.id
          }
        });
        
        customerId = customer.id;
        
        // Save the customer ID to the user record
        await storage.updateUserSubscription(userId, {
          stripeCustomerId: customerId
        });
      }
      
      // First, create the product
      const product = await stripe.products.create({
        name: `ContractCompanion ${plan.name}`,
        description: `Monthly subscription to ContractCompanion ${plan.name} - ${plan.description}`
      });
      
      // Create the price
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: plan.price,
        recurring: {
          interval: 'month'
        }
      });
      
      // Create a subscription with a trial period
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: price.id
          }
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7, // 7-day free trial
        metadata: {
          planId: planId,
          planName: plan.name,
          features: JSON.stringify(plan.features)
        }
      });
      
      // Update user record with subscription info
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : new Date();
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: "trialing",
        trialEndsAt: trialEnd,
        planId: planId
      });
      
      // Return the client secret so the frontend can complete the payment
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent as any;
      
      console.log('Subscription created:', {
        id: subscription.id,
        hasInvoice: !!invoice,
        hasPaymentIntent: !!paymentIntent,
        clientSecret: paymentIntent?.client_secret
      });
      
      // Create a payment intent if one doesn't exist
      let clientSecret = paymentIntent?.client_secret;
      
      // If no payment intent is available (e.g., during trial), create one for setup
      if (!clientSecret) {
        try {
          // Create a simple setup intent instead - this works better for collecting payment methods
          const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            usage: 'off_session',
            description: `Payment method setup for ContractCompanion ${plan.name} plan`,
          });
          
          clientSecret = setupIntent.client_secret;
          console.log('Created setup intent:', setupIntent.id, 'with client secret');
        } catch (setupError) {
          console.error('Error creating setup intent:', setupError);
        }
      }
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        trialEnd: trialEnd,
        planId: planId
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  
  // Create a checkout session for subscription - simplified for reliability
  app.post("/api/create-checkout-session", async (req: any, res) => {
    const checkoutSessionSchema = z.object({ 
      plan: z.enum(['basic', 'standard', 'premium']).optional(), 
      planId: z.enum(['basic', 'standard', 'premium']).optional() 
    }).superRefine((data, ctx) => { 
      if (!data.plan && !data.planId) { 
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Either plan or planId must be provided' }); 
      } 
    });

    try {
      const validationResult = checkoutSessionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid checkout session data.', errors: validationResult.error.flatten().fieldErrors });
      }
      const { plan: validatedPlan, planId: validatedPlanId } = validationResult.data;
      
      // Get the requested plan (default to standard)
      const planId = (validatedPlan || validatedPlanId || 'standard') as keyof typeof SUBSCRIPTION_PLANS;
      
      if (!SUBSCRIPTION_PLANS[planId]) {
        return res.status(400).json({ message: "Invalid subscription plan key." });
      }
      
      const plan = SUBSCRIPTION_PLANS[planId];
      
      // Handle anonymous checkout - we'll link the user account after login
      let userId = 'anonymous';
      let user = null;
      let customerId = null;
      
      if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.id) { // Changed to generic req.user.id
        userId = req.user.id; // Changed to generic id
        user = await storage.getUser(userId);
        
        // Use existing customer ID if available
        if (user && user.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        }
      }
      
      if (!customerId) {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user?.email || 'guest@example.com',
          name: user?.firstName || 'Guest User',
          metadata: {
            userId: userId
          }
        });
        
        customerId = customer.id;
        
        // Save the customer ID to the user record
        await storage.updateUserSubscription(userId, {
          stripeCustomerId: customerId
        });
      }
      
      // Create a checkout session with price_data instead of price ID
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ContractCompanion ${plan.name} Plan`,
                description: plan.description || `${plan.name} subscription with 7-day free trial`
              },
              unit_amount: plan.price, // Price is already in cents
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `https://${req.headers.host || req.hostname}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://${req.headers.host || req.hostname}/subscription`,
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            userId: userId,
            planId: planId
          }
        },
        metadata: {
          userId: userId,
          planId: planId
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto'
      });
      
      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Checkout session creation error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.delete("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      // Cancel the subscription at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      
      // Update the user's subscription status
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: "canceling"
      });
      
      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
  
  // Webhook for Stripe events
  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Stripe webhook secret is not set in environment variables.');
      return res.status(400).send('Webhook secret not configured.');
    }

    let event;
    
    try {
      // req.body should be the raw Buffer here
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object as Stripe.Subscription;
        // Handle subscription created
        break;
      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        // Update user's subscription status
        if (subscriptionUpdated.status === 'active') {
          // Find user by customer ID
          const customer = await stripe.customers.retrieve(subscriptionUpdated.customer as string);
          const userId = customer.metadata.userId;
          
          if (userId) {
            await storage.updateUserSubscription(userId, {
              subscriptionStatus: "active",
              stripeSubscriptionId: subscriptionUpdated.id
            });
          }
        }
        break;
      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation
        const customer = await stripe.customers.retrieve(subscriptionDeleted.customer as string);
        const userId = customer.metadata.userId;
        
        if (userId) {
          await storage.updateUserSubscription(userId, {
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null
          });
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response
    res.send({ received: true });
  });
  
  // Dashboard Routes
  
  // Get user usage data for dashboard
  app.get("/api/usage", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      
      // Get user plan features/limits
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userPlanId = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing" 
        ? user.planId || "basic" 
        : "basic";
        
      const limits = SUBSCRIPTION_PLANS[userPlanId]?.features || SUBSCRIPTION_PLANS.basic.features;
      
      // Get query count for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const queriesUsed = await storage.getUserMonthlyQueryCount(userId, currentMonth, currentYear);
      
      res.json({
        queriesUsed,
        limits,
        planId: userPlanId
      });
    } catch (error) {
      console.error("Error fetching usage data:", error);
      res.status(500).json({ message: "Error fetching usage data" });
    }
  });
  
  // Get user's saved chat messages
  app.get("/api/saved-chats", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      const savedChats = await storage.getUserSavedChatMessages(userId);
      
      // For each saved chat, get the contract name
      const enrichedChats = await Promise.all(
        savedChats.map(async (chat) => {
          const contract = await storage.getContract(chat.contractId);
          return {
            ...chat,
            contractName: contract?.name || "Unknown Contract"
          };
        })
      );
      
      res.json(enrichedChats);
    } catch (error) {
      console.error("Error fetching saved chats:", error);
      res.status(500).json({ message: "Error fetching saved chats" });
    }
  });
  
  // Save/unsave chat messages
  app.post("/api/chats/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = req.params.id;
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      
      await storage.saveChatMessage(messageId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving chat message:", error);
      res.status(500).json({ message: "Error saving chat message" });
    }
  });
  
  app.post("/api/chats/:id/unsave", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = req.params.id;
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      
      await storage.unsaveChatMessage(messageId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unsaving chat message:", error);
      res.status(500).json({ message: "Error unsaving chat message" });
    }
  });
  
  // Create Stripe Customer Portal session
  app.post("/api/create-portal-session", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No stripe customer ID found" });
      }
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/dashboard`,
      });
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Error creating portal session" });
    }
  });
  
  // Cancel subscription
  app.post("/api/cancel-subscription", isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub; // Replit specific
      const userId = req.user.id; // Changed to generic id
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No subscription found" });
      }
      
      // Cancel at period end instead of immediately
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      
      // Update user subscription status
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: "canceled"
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Error canceling subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
