// server/routes/contractRoutes.ts
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated } from '../googleAuth';
import { checkSubscription } from '../middleware/subscriptionCheck';
import { analyzeContract, queryContract } from '../anthropic'; // Assuming this is used by contract routes
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdf from 'pdf-parse';

const router = Router();

// Define multer instance (specific to contract uploads)
const upload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Corrected path to be relative to the project root, assuming 'uploads' is at project root
      const uploadDir = path.join(process.cwd(), 'uploads'); 
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

// Define Zod schema for contract query
const contractQuerySchema = z.object({ query: z.string().min(1, "Query cannot be empty") });

// === START OF MOVED CONTRACT ROUTES ===

// GET / (was /api/contracts) - Get all contracts for a user
router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const contracts = await storage.getUserContracts(userId);
    res.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ message: "Failed to fetch contracts" });
  }
});

// POST /upload (was /api/contracts/upload) - Upload a new contract
router.post("/upload", isAuthenticated, upload.single("contract"), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const file = req.file;
    
    const pdfBuffer = fs.readFileSync(file.path);
    
    let contractText = "";
    try {
      const data = await pdf(pdfBuffer);
      contractText = data.text;
    } catch (extractionError) {
      console.error("Error extracting text from PDF:", extractionError);
      fs.unlinkSync(file.path); // Clean up uploaded file if extraction fails
      return res.status(500).json({ message: "Failed to extract text from PDF." });
    }

    if (!contractText || contractText.trim().length === 0) {
      console.warn("PDF text extraction resulted in empty content for file:", file.originalname);
      // Optionally, clean up file if empty text is not allowed
      // fs.unlinkSync(file.path);
      // return res.status(400).json({ message: "PDF content could not be extracted or is empty." });
    }
    
    const analysis = await analyzeContract(contractText);
    
    const contract = await storage.createContract({
      userId,
      name: file.originalname,
      filePath: file.path, // Store the path where multer saved it
      fileSize: file.size,
      textContent: contractText,
      analysis,
    });
    
    res.status(201).json({
      id: contract.id,
      name: contract.name,
      uploadedAt: contract.uploadedAt,
    });
  } catch (error: any) {
    console.error("Error uploading contract:", error);
    if (req.file && req.file.path) { // Attempt to clean up file on other errors too
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting uploaded file after failure:", err);
        });
    }
    res.status(500).json({ message: "Failed to upload contract", error: error.message });
  }
});
  
// GET /:id (was /api/contracts/:id) - Get a specific contract
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const contractId = parseInt(req.params.id, 10);
     if (isNaN(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID.' });
    }
    const userId = req.user.id;
    const contract = await storage.getContract(contractId);
    
    if (!contract || contract.userId !== userId) {
      return res.status(404).json({ message: "Contract not found or access denied." });
    }
    res.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ message: "Failed to fetch contract" });
  }
});

// GET /:id/file (was /api/contracts/:id/file) - Serve contract PDF file
router.get("/:id/file", isAuthenticated, async (req: any, res: Response) => {
  try {
    const contractId = parseInt(req.params.id, 10);
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID.' });
    }
    const userId = req.user.id;
    const contract = await storage.getContract(contractId);
    
    if (!contract || contract.userId !== userId) {
      return res.status(404).json({ message: "Contract not found or access denied." });
    }
    
    if (!fs.existsSync(contract.filePath)) {
      console.error("Contract file not found at path:", contract.filePath);
      return res.status(404).json({ message: "Contract file not found on server." });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(contract.name)}"`); // Use path.basename for safety
    
    const fileStream = fs.createReadStream(contract.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving contract file:", error);
    res.status(500).json({ message: "Failed to serve contract file" });
  }
});
  
// DELETE /:id (was /api/contracts/:id) - Delete a contract
router.delete("/:id", isAuthenticated, checkSubscription, async (req: any, res: Response) => {
  try {
    const contractId = parseInt(req.params.id, 10);
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID.' });
    }
    const userId = req.user.id;
    const contract = await storage.getContract(contractId);
    
    if (!contract || contract.userId !== userId) {
      return res.status(404).json({ message: "Contract not found or access denied for deletion." });
    }
    
    if (fs.existsSync(contract.filePath)) {
      fs.unlinkSync(contract.filePath);
    }
    
    await storage.deleteContract(contractId);
    res.status(200).json({ message: "Contract deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ message: "Failed to delete contract", error: error.message });
  }
});

// GET /:id/chat (was /api/contracts/:id/chat) - Get chat history for a contract
router.get("/:id/chat", isAuthenticated, async (req: any, res: Response) => {
  try {
    const contractId = parseInt(req.params.id, 10);
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID.' });
    }
    const userId = req.user.id;
    const contract = await storage.getContract(contractId); // Check ownership/existence

    if (!contract || contract.userId !== userId) {
      return res.status(404).json({ message: "Contract not found or access denied for chat history." });
    }
    
    const chatHistory = await storage.getContractChatHistory(contractId);
    res.json(chatHistory);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

// POST /:id/query (was /api/contracts/:id/query) - Query a contract
router.post("/:id/query", isAuthenticated, async (req: any, res: Response) => {
  try {
    const contractId = parseInt(req.params.id, 10);
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID.' });
    }

    const validationResult = contractQuerySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid query data.', errors: validationResult.error.flatten().fieldErrors });
    }
    const { query } = validationResult.data;

    const userId = req.user.id;
    const contract = await storage.getContract(contractId);
    
    if (!contract || contract.userId !== userId) {
      return res.status(404).json({ message: "Contract not found or access denied for querying." });
    }
    
    const responseText = await queryContract(contract.textContent, query);
    
    await storage.createChatMessage({
      contractId,
      userId,
      role: "user",
      content: query,
    });
    
    const assistantMessage = await storage.createChatMessage({
      contractId,
      userId,
      role: "assistant",
      content: responseText,
    });
    
    res.json({
      id: assistantMessage.id,
      content: responseText, // Changed from 'response' to 'responseText' for clarity
    });
  } catch (error: any) {
    console.error("Error querying contract:", error);
    res.status(500).json({ message: "Failed to query contract", error: error.message });
  }
});
// === END OF MOVED CONTRACT ROUTES ===

export default router;
