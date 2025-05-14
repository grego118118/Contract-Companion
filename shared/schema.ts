import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  textContent: text("text_content").notNull(),
  analysis: text("analysis"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  publishedAt: timestamp("published_at").defaultNow(),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog post categories table
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for blog posts and categories
export const blogPostCategories = pgTable("blog_post_categories", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => blogCategories.id, { onDelete: "cascade" }),
}, (table) => [
  index("blog_post_category_idx").on(table.postId, table.categoryId),
]);

// User type
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Contract types
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = Omit<typeof contracts.$inferInsert, "id">;
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true });

// Chat message types
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = Omit<typeof chatMessages.$inferInsert, "id">;
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });

// Blog post types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = Omit<typeof blogPosts.$inferInsert, "id">;
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true });

// Blog category types
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = Omit<typeof blogCategories.$inferInsert, "id">;
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ id: true });

// Blog post category junction types
export type BlogPostCategory = typeof blogPostCategories.$inferSelect;
export type InsertBlogPostCategory = Omit<typeof blogPostCategories.$inferInsert, "id">;
export const insertBlogPostCategorySchema = createInsertSchema(blogPostCategories).omit({ id: true });
