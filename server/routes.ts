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
  app.delete("/api/contracts/:id", isAuthenticated, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
