import { db } from "../db";
import { sql } from "drizzle-orm";
import crypto from 'crypto';

interface CachedResponse {
  query: string;
  contractId: string;
  response: string;
  createdAt: Date;
}

// Hash function to create deterministic keys for queries
function createQueryHash(contractId: string, query: string): string {
  // Normalize query by removing extra spaces and converting to lowercase
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Create hash
  return crypto
    .createHash('md5')
    .update(`${contractId}:${normalizedQuery}`)
    .digest('hex');
}

// Check if a response is cached for this query
export async function getCachedResponse(contractId: string, query: string): Promise<string | null> {
  try {
    const queryHash = createQueryHash(contractId, query);
    
    // Check if we have this query in cache
    const [cachedResult] = await db.execute(sql`
      SELECT response, created_at
      FROM query_cache
      WHERE query_hash = ${queryHash}
      LIMIT 1
    `);
    
    if (!cachedResult) {
      return null;
    }
    
    // Check if cache is still valid (1 week)
    const cacheDate = new Date(cachedResult.created_at);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - 7); // Cache expires after 7 days
    
    if (cacheDate < expiryDate) {
      // Cache expired, remove it
      await db.execute(sql`
        DELETE FROM query_cache
        WHERE query_hash = ${queryHash}
      `);
      return null;
    }
    
    return cachedResult.response;
  } catch (error) {
    console.error('Error getting cached response:', error);
    return null;
  }
}

// Cache a response for future use
export async function cacheResponse(contractId: string, query: string, response: string): Promise<void> {
  try {
    const queryHash = createQueryHash(contractId, query);
    
    // Insert or update cache entry
    await db.execute(sql`
      INSERT INTO query_cache (query_hash, contract_id, query_text, response, created_at)
      VALUES (${queryHash}, ${contractId}, ${query}, ${response}, ${new Date().toISOString()})
      ON CONFLICT (query_hash) 
      DO UPDATE SET 
        response = ${response},
        created_at = ${new Date().toISOString()}
    `);
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

// Clean up old cache entries
export async function cleanupCache(): Promise<void> {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - 7); // Cache expires after 7 days
    
    await db.execute(sql`
      DELETE FROM query_cache
      WHERE created_at < ${expiryDate.toISOString()}
    `);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

// Count cache hits and misses for analytics
export async function recordCacheEvent(isHit: boolean): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    if (isHit) {
      await db.execute(sql`
        INSERT INTO cache_stats (date, cache_hits, cache_misses)
        VALUES (${today}, 1, 0)
        ON CONFLICT (date)
        DO UPDATE SET cache_hits = cache_hits + 1
      `);
    } else {
      await db.execute(sql`
        INSERT INTO cache_stats (date, cache_hits, cache_misses)
        VALUES (${today}, 0, 1)
        ON CONFLICT (date)
        DO UPDATE SET cache_misses = cache_misses + 1
      `);
    }
  } catch (error) {
    console.error('Error recording cache event:', error);
  }
}

// Initialize cache tables
export async function initializeCache(): Promise<void> {
  try {
    // Create query_cache table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS query_cache (
        query_hash TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        query_text TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `);
    
    // Create cache_stats table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cache_stats (
        date TEXT PRIMARY KEY,
        cache_hits INTEGER NOT NULL DEFAULT 0,
        cache_misses INTEGER NOT NULL DEFAULT 0
      )
    `);
    
    console.log('Cache tables initialized');
  } catch (error) {
    console.error('Error initializing cache tables:', error);
  }
}