import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeContract, queryContract } from "./anthropic";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { checkSubscription } from "./middleware/subscriptionCheck";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any, // Cast to any to bypass type check
});

// Subscription pricing tiers in cents
const SUBSCRIPTION_PRICES = {
  basic: 999,    // $9.99 per month
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Contracts API
  
  // Get all contracts for a user
  app.get("/api/contracts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contracts = await storage.getUserContracts(userId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  // Get a specific contract
  app.get("/api/contracts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contractId = req.params.id;
      
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this contract" });
      }
      
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });
  
  // Serve contract PDF file
  app.get("/api/contracts/:id/file", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contractId = req.params.id;
      
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this contract" });
      }
      
      // Check if file exists
      if (!fs.existsSync(contract.filePath)) {
        return res.status(404).json({ message: "Contract file not found" });
      }
      
      // Set appropriate content type header
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${contract.name}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(contract.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error serving contract file:", error);
      res.status(500).json({ message: "Failed to serve contract file" });
    }
  });

  // Upload a new contract
  app.post("/api/contracts/upload", isAuthenticated, upload.single("contract"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      
      // Extract text from PDF
      const pdfBuffer = fs.readFileSync(file.path);
      
      // Use pdf-lib to load the document
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      // Extract text content from each page
      let contractText = "";
      for (const page of pages) {
        // Note: pdf-lib doesn't directly extract text, so we're creating a placeholder
        // In a production app, we'd use a more robust text extraction library
        const pageText = `[Content from page ${pages.indexOf(page) + 1}]`;
        contractText += pageText + "\n\n";
      }
      
      // Use Anthropic to analyze the contract
      const analysis = await analyzeContract(contractText);
      
      // Store the contract in the database
      const contract = await storage.createContract({
        userId,
        name: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        textContent: contractText,
        analysis,
      });
      
      res.status(201).json({
        id: contract.id,
        name: contract.name,
        uploadedAt: contract.uploadedAt,
      });
    } catch (error) {
      console.error("Error uploading contract:", error);
      res.status(500).json({ message: "Failed to upload contract" });
    }
  });

  // Delete a contract
  app.delete("/api/contracts/:id", isAuthenticated, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contractId = req.params.id;
      
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this contract" });
      }
      
      // Delete the file
      if (fs.existsSync(contract.filePath)) {
        fs.unlinkSync(contract.filePath);
      }
      
      // Delete from database
      await storage.deleteContract(contractId);
      
      res.status(200).json({ message: "Contract deleted successfully" });
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // Get chat history for a contract
  app.get("/api/contracts/:id/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contractId = req.params.id;
      
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this chat history" });
      }
      
      const chatHistory = await storage.getContractChatHistory(contractId);
      res.json(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Query a contract
  app.post("/api/contracts/:id/query", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contractId = req.params.id;
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to query this contract" });
      }
      
      // Use Anthropic to query the contract
      const response = await queryContract(contract.textContent, query);
      
      // Save the conversation to history
      const chatMessage = await storage.createChatMessage({
        contractId,
        userId,
        role: "user",
        content: query,
      });
      
      const assistantMessage = await storage.createChatMessage({
        contractId,
        userId,
        role: "assistant",
        content: response,
      });
      
      res.json({
        id: assistantMessage.id,
        content: response,
      });
    } catch (error) {
      console.error("Error querying contract:", error);
      res.status(500).json({ message: "Failed to query contract" });
    }
  });

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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
          // For development purposes, automatically extend the trial instead of expiring it
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);
          
          await storage.updateUserSubscription(userId, {
            subscriptionStatus: "trial",
            trialEndsAt: trialEnd
          });
          
          return res.json({
            status: "trial",
            trialEndsAt: trialEnd,
            daysLeft: 7,
            planId: user.planId || "standard",
            message: "Your trial has been automatically extended."
          });
        }
        
        // Trial is still active
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
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If user already has a subscription
      if (user.subscriptionStatus === "active" && user.stripeSubscriptionId) {
        return res.status(400).json({ message: "User already has an active subscription" });
      }
      
      // Get the requested plan (default to standard)
      const planId = (req.body.plan || 'standard') as keyof typeof SUBSCRIPTION_PLANS;
      if (!SUBSCRIPTION_PLANS[planId]) {
        return res.status(400).json({ message: "Invalid subscription plan" });
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
      const paymentIntent = invoice.payment_intent as any;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        trialEnd: trialEnd,
        planId: planId
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  
  // Cancel subscription
  app.delete("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
    
    let event;
    
    try {
      // Verify webhook signature
      // For this, you would need to set an endpoint secret in your Stripe dashboard
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      
      // Since this is a demo, we'll just parse the event directly
      event = req.body;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
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

  const httpServer = createServer(app);
  return httpServer;
}
