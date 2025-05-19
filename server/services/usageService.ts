import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { users } from "@shared/schema";

export interface UsageLimits {
  maxQueries: number;
  maxContracts: number;
  chatHistoryDays: number;
  modelTier: 'basic' | 'standard' | 'premium';
}

// Usage plans and their limits
const PLAN_LIMITS: Record<string, UsageLimits> = {
  'trial': {
    maxQueries: 10,        // Trial users get 10 queries max
    maxContracts: 1,        // Trial users can upload 1 contract
    chatHistoryDays: 7,     // Trial users get 7-day chat history
    modelTier: 'basic'      // Trial users get basic model
  },
  'basic': {
    maxQueries: 20,         // Basic users get 20 queries per month
    maxContracts: 1,        // Basic users can upload 1 contract
    chatHistoryDays: 7,     // Basic users get 7-day chat history
    modelTier: 'basic'      // Basic users get basic model
  },
  'standard': {
    maxQueries: 50,         // Standard users get 50 queries per month
    maxContracts: 3,        // Standard users can upload 3 contracts
    chatHistoryDays: 30,    // Standard users get 30-day chat history
    modelTier: 'standard'   // Standard users get standard model
  },
  'premium': {
    maxQueries: -1,         // Premium users get unlimited queries
    maxContracts: -1,       // Premium users can upload unlimited contracts
    chatHistoryDays: -1,    // Premium users get permanent chat history
    modelTier: 'premium'    // Premium users get premium model
  },
  'union-small': {
    maxQueries: -1,         // Union plans get unlimited queries
    maxContracts: 10,       // Small union can upload 10 contracts
    chatHistoryDays: 60,    // 60-day chat history
    modelTier: 'premium'    // Union plans get premium model
  },
  'union-medium': {
    maxQueries: -1,         // Union plans get unlimited queries
    maxContracts: -1,       // Medium union can upload unlimited contracts
    chatHistoryDays: -1,    // Permanent chat history
    modelTier: 'premium'    // Union plans get premium model
  }
};

// Create a table to track usage
export async function trackQuery(userId: string): Promise<boolean> {
  try {
    // Get user subscription status
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      console.error(`User ${userId} not found`);
      return false;
    }

    // Get monthly query count
    const subscriptionType = user.subscriptionStatus || 'trial';
    
    // If user has unlimited queries, no need to check limits
    const limits = PLAN_LIMITS[subscriptionType];
    if (limits.maxQueries === -1) {
      return true;
    }

    // Get current month's usage count from chatMessages table
    const thisMonth = new Date();
    thisMonth.setDate(1); // First day of current month
    thisMonth.setHours(0, 0, 0, 0);

    const [queryCount] = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM chat_messages 
      WHERE user_id = ${userId} 
      AND role = 'user' 
      AND created_at >= ${thisMonth.toISOString()}
    `);

    const count = parseInt(queryCount?.count || '0');
    
    // Check if user has reached their limit
    return count < limits.maxQueries;
  } catch (error) {
    console.error('Error tracking query:', error);
    return false;
  }
}

// Get user's plan limits
export async function getUserLimits(userId: string): Promise<UsageLimits> {
  try {
    // Get user subscription status
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      console.error(`User ${userId} not found`);
      return PLAN_LIMITS['trial']; // Default to trial limits
    }

    const subscriptionType = user.subscriptionStatus || 'trial';
    return PLAN_LIMITS[subscriptionType] || PLAN_LIMITS['trial'];
  } catch (error) {
    console.error('Error getting user limits:', error);
    return PLAN_LIMITS['trial']; // Default to trial limits
  }
}

// Check if user can upload more contracts
export async function canUploadContract(userId: string): Promise<boolean> {
  try {
    // Get user limits
    const limits = await getUserLimits(userId);
    
    // If unlimited contracts, return true
    if (limits.maxContracts === -1) {
      return true;
    }
    
    // Count user's existing contracts
    const [contractCount] = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM contracts 
      WHERE user_id = ${userId}
    `);
    
    const count = parseInt(contractCount?.count || '0');
    
    // Check if user has reached their limit
    return count < limits.maxContracts;
  } catch (error) {
    console.error('Error checking contract upload limit:', error);
    return false;
  }
}

// Get the appropriate AI model tier for the user
export async function getModelTier(userId: string): Promise<string> {
  try {
    const limits = await getUserLimits(userId);
    
    // Map modelTier to actual model names
    switch (limits.modelTier) {
      case 'premium':
        return "claude-3-7-sonnet-20250219"; // Premium users get the best model
      case 'standard':
        return "claude-3-7-sonnet-20250219"; // Standard users get a good model
      case 'basic':
      default:
        return "claude-3-7-sonnet-20250219"; // Basic users get a simpler model
    }
  } catch (error) {
    console.error('Error getting model tier:', error);
    return "claude-3-7-sonnet-20250219"; // Default to basic model
  }
}

// Prune old chat messages based on user's plan
export async function pruneOldChatMessages(): Promise<void> {
  try {
    // Get all users
    const userList = await db.select().from(users);
    
    for (const user of userList) {
      const limits = PLAN_LIMITS[user.subscriptionStatus || 'trial'];
      
      // If user has permanent chat history, skip
      if (limits.chatHistoryDays === -1) continue;
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - limits.chatHistoryDays);
      
      // Delete old messages
      await db.execute(sql`
        DELETE FROM chat_messages 
        WHERE user_id = ${user.id} 
        AND created_at < ${cutoffDate.toISOString()}
      `);
    }
  } catch (error) {
    console.error('Error pruning old chat messages:', error);
  }
}

// Initialize usage tracking table
export async function initializeUsageTracking(): Promise<void> {
  // This function would create any necessary tables or indexes
  // But we're using the existing schema, so no need to create new tables
  console.log('Usage tracking initialized');
}