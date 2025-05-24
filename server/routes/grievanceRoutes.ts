// server/routes/grievanceRoutes.ts
import { Router, type Request, type Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../googleAuth'; // Assuming googleAuth is the final auth file
import { insertGrievanceSchema } from '@shared/schema'; // Zod schema for validation

const router = Router();

// POST /api/grievances - Create a new grievance
router.post('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    // Validate request body against Zod schema
    // Note: insertGrievanceSchema omits userId, status, id, createdAt, updatedAt
    // We expect contractId, violatedClause (optional), description from client
    const validationResult = insertGrievanceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid grievance data.', errors: validationResult.error.flatten().fieldErrors });
    }

    const { contractId, violatedClause, description } = validationResult.data;
    const userId = req.user.id; // From isAuthenticated middleware

    // Type assertion for data passed to storage, matching its expectation
    const grievanceDataForStorage = {
        contractId,
        violatedClause,
        description,
    };

    const newGrievance = await storage.createGrievance(grievanceDataForStorage, userId);
    res.status(201).json(newGrievance);
  } catch (error: any) {
    console.error('Error creating grievance:', error);
    res.status(500).json({ message: 'Failed to create grievance.', error: error.message });
  }
});

// GET /api/grievances - Get all grievances for the logged-in user
router.get('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const userGrievances = await storage.getGrievancesForUser(userId);
    res.json(userGrievances);
  } catch (error: any) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ message: 'Failed to fetch grievances.', error: error.message });
  }
});

// GET /api/grievances/:id - Get a specific grievance by ID
router.get('/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const grievanceId = parseInt(req.params.id, 10);
    if (isNaN(grievanceId)) {
      return res.status(400).json({ message: 'Invalid grievance ID.' });
    }
    const userId = req.user.id;
    const grievance = await storage.getGrievanceById(grievanceId, userId);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found or access denied.' });
    }
    res.json(grievance);
  } catch (error: any) {
    console.error('Error fetching grievance by ID:', error);
    res.status(500).json({ message: 'Failed to fetch grievance.', error: error.message });
  }
});

// PUT /api/grievances/:id/status - Update grievance status
router.put('/:id/status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const grievanceId = parseInt(req.params.id, 10);
    if (isNaN(grievanceId)) {
      return res.status(400).json({ message: 'Invalid grievance ID.' });
    }
    const { status } = req.body;
    if (!status || typeof status !== 'string') { // Basic validation for status
      return res.status(400).json({ message: 'Invalid status provided.' });
    }
    
    const userId = req.user.id; 
    // For now, any user can update status of their own grievance.
    // In a real app, this might be restricted (e.g., only admins can change to 'resolved').
    const updatedGrievance = await storage.updateGrievanceStatus(grievanceId, userId, status);
    if (!updatedGrievance) {
      return res.status(404).json({ message: 'Grievance not found or access denied for update.' });
    }
    res.json(updatedGrievance);
  } catch (error: any) {
    console.error('Error updating grievance status:', error);
    res.status(500).json({ message: 'Failed to update grievance status.', error: error.message });
  }
});

export default router; // Export the router
