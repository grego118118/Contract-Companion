import {
  users,
  type User,
  type UpsertUser,
  contracts,
  type Contract,
  type InsertContract,
  chatMessages,
  type ChatMessage,
  type InsertChatMessage,
  blogPosts,
  type BlogPost,
  blogCategories,
  type BlogCategory,
  blogPostCategories
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ne, sql, inArray } from "drizzle-orm";
import path from "path";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    trialEndsAt?: Date;
  }): Promise<User>;
  
  // Contract operations
  getContract(id: number | string): Promise<Contract | undefined>;
  getUserContracts(userId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  deleteContract(id: number | string): Promise<void>;
  
  // Chat operations
  getChatMessage(id: number | string): Promise<ChatMessage | undefined>;
  getContractChatHistory(contractId: number | string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Blog operations
  getBlogPost(id: number | string): Promise<BlogPost | undefined>;
  getBlogPosts(): Promise<any[]>;
  getFeaturedBlogPosts(limit: number): Promise<any[]>;
  getRelatedBlogPosts(postId: number | string, limit: number): Promise<any[]>;
  getBlogCategory(id: number | string): Promise<BlogCategory | undefined>;
  getBlogCategories(): Promise<BlogCategory[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  async updateUserSubscription(userId: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    planId?: string;
    trialEndsAt?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Contract operations
  async getContract(id: number | string): Promise<Contract | undefined> {
    const contractId = typeof id === 'string' ? parseInt(id, 10) : id;
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
    
    // Add file URL for frontend
    if (contract) {
      const fileName = path.basename(contract.filePath);
      (contract as any).fileUrl = `/api/contracts/${contract.id}/file`;
    }
    
    return contract;
  }

  async getUserContracts(userId: string): Promise<Contract[]> {
    const userContracts = await db
      .select()
      .from(contracts)
      .where(eq(contracts.userId, userId))
      .orderBy(desc(contracts.uploadedAt));
    
    // Add file URLs and conversation counts
    for (const contract of userContracts) {
      const fileName = path.basename(contract.filePath);
      (contract as any).fileUrl = `/api/contracts/${contract.id}/file`;
      
      // Count conversations for this contract
      const [result] = await db
        .select({ count: sql<number>`count(distinct case when ${chatMessages.role} = 'user' then date_trunc('hour', ${chatMessages.createdAt}) end)` })
        .from(chatMessages)
        .where(eq(chatMessages.contractId, contract.id));
      
      (contract as any).conversationCount = result?.count || 0;
    }
    
    return userContracts;
  }

  async createContract(contractData: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values({
        ...contractData,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Add file URL for frontend
    const fileName = path.basename(contract.filePath);
    (contract as any).fileUrl = `/api/contracts/${contract.id}/file`;
    
    return contract;
  }

  async deleteContract(id: number | string): Promise<void> {
    const contractId = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(contracts).where(eq(contracts.id, contractId));
  }

  // Chat operations
  async getChatMessage(id: number | string): Promise<ChatMessage | undefined> {
    const messageId = typeof id === 'string' ? parseInt(id, 10) : id;
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId));
    return message;
  }

  async getContractChatHistory(contractId: number | string): Promise<ChatMessage[]> {
    const cId = typeof contractId === 'string' ? parseInt(contractId, 10) : contractId;
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.contractId, cId))
      .orderBy(chatMessages.createdAt);
    return messages;
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...messageData,
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  // Blog operations
  async getBlogPost(id: number | string): Promise<any | undefined> {
    const postId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));
    
    if (!post) return undefined;
    
    // Get categories for this post
    const categories = await this.getPostCategories(postId);
    
    // Get author info
    let author = { name: "ContractCompanion Team", imageUrl: "https://ui-avatars.com/api/?name=CC+Team" };
    
    if (post.authorId) {
      const userInfo = await this.getUser(post.authorId);
      if (userInfo) {
        author = {
          name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || "ContractCompanion Team",
          imageUrl: userInfo.profileImageUrl || "https://ui-avatars.com/api/?name=CC+Team"
        };
      }
    }
    
    return {
      ...post,
      categories,
      author
    };
  }

  async getBlogPosts(): Promise<any[]> {
    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt));
    
    // Enhance posts with categories
    for (const post of posts) {
      post.categories = await this.getPostCategories(post.id);
    }
    
    return posts;
  }

  async getFeaturedBlogPosts(limit: number): Promise<any[]> {
    const featuredPosts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isFeatured, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
    
    // If not enough featured posts, get most recent ones
    if (featuredPosts.length < limit) {
      const regularPosts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.isFeatured, false))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(limit - featuredPosts.length);
      
      featuredPosts.push(...regularPosts);
    }
    
    // Enhance posts with categories
    for (const post of featuredPosts) {
      post.categories = await this.getPostCategories(post.id);
    }
    
    return featuredPosts;
  }

  async getRelatedBlogPosts(postId: number | string, limit: number): Promise<any[]> {
    const pId = typeof postId === 'string' ? parseInt(postId, 10) : postId;
    
    // Get categories of the current post
    const categories = await this.getPostCategories(pId);
    const categoryIds = categories.map(c => c.id);
    
    // If no categories, just get recent posts
    if (categoryIds.length === 0) {
      return this.getFeaturedBlogPosts(limit);
    }
    
    // Get posts that share categories but exclude current post
    const relatedPostIds = await db
      .select({ postId: blogPostCategories.postId })
      .from(blogPostCategories)
      .where(and(
        inArray(blogPostCategories.categoryId, categoryIds),
        ne(blogPostCategories.postId, pId)
      ))
      .groupBy(blogPostCategories.postId)
      .limit(limit);
    
    const relatedPosts = [];
    
    for (const { postId } of relatedPostIds) {
      const post = await this.getBlogPost(postId);
      if (post) relatedPosts.push(post);
    }
    
    // If not enough related posts, get recent ones
    if (relatedPosts.length < limit) {
      const recentPosts = await db
        .select()
        .from(blogPosts)
        .where(ne(blogPosts.id, pId))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(limit - relatedPosts.length);
      
      for (const post of recentPosts) {
        post.categories = await this.getPostCategories(post.id);
        relatedPosts.push(post);
      }
    }
    
    return relatedPosts;
  }

  async getBlogCategory(id: number | string): Promise<BlogCategory | undefined> {
    const categoryId = typeof id === 'string' ? parseInt(id, 10) : id;
    const [category] = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.id, categoryId));
    return category;
  }

  async getBlogCategories(): Promise<BlogCategory[]> {
    return db.select().from(blogCategories);
  }

  // Helper methods
  private async getPostCategories(postId: number | string): Promise<any[]> {
    const pId = typeof postId === 'string' ? parseInt(postId, 10) : postId;
    
    const categoryLinks = await db
      .select({
        categoryId: blogPostCategories.categoryId
      })
      .from(blogPostCategories)
      .where(eq(blogPostCategories.postId, pId));
    
    if (categoryLinks.length === 0) return [];
    
    const categoryIds = categoryLinks.map(link => link.categoryId);
    
    const categories = await db
      .select()
      .from(blogCategories)
      .where(inArray(blogCategories.id, categoryIds));
    
    return categories;
  }
}

export const storage = new DatabaseStorage();
