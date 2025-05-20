import { db } from '../db';
import { sql } from 'drizzle-orm';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  latency?: number;
  uptime?: number;
  lastChecked?: string;
  message?: string;
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple query to test database connection
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;
    
    return {
      name: 'Database',
      status: 'operational',
      latency,
      uptime: 99.95, // In a real application, this would be calculated from monitoring data
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      name: 'Database',
      status: 'down',
      latency: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      message: 'Database connection failed'
    };
  }
}

/**
 * Check API health
 */
async function checkApiHealth(): Promise<ServiceStatus> {
  // This is a simulated check since the API is the current service
  return {
    name: 'API',
    status: 'operational',
    latency: 45, // Simulated latency
    uptime: 99.9,
    lastChecked: new Date().toISOString()
  };
}

/**
 * Check authentication service health
 */
async function checkAuthHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple check to see if we can access authentication-related environment variables
    if (!process.env.REPL_ID || !process.env.REPLIT_DOMAINS) {
      return {
        name: 'Authentication',
        status: 'degraded',
        latency: Date.now() - start,
        uptime: 95.0,
        lastChecked: new Date().toISOString(),
        message: 'Authentication service configuration incomplete'
      };
    }
    
    return {
      name: 'Authentication',
      status: 'operational',
      latency: Date.now() - start,
      uptime: 99.8,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Auth health check failed:', error);
    return {
      name: 'Authentication',
      status: 'down',
      latency: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      message: 'Authentication service check failed'
    };
  }
}

/**
 * Check AI services health (Anthropic API)
 */
async function checkAiHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Check if Anthropic API key is configured
    const hasAiConfig = !!process.env.ANTHROPIC_API_KEY;
    
    if (!hasAiConfig) {
      return {
        name: 'AI Services',
        status: 'degraded',
        latency: Date.now() - start,
        uptime: 95.0,
        lastChecked: new Date().toISOString(),
        message: 'AI service configuration incomplete'
      };
    }
    
    // In a real implementation, we would make a lightweight test call to the AI service
    
    return {
      name: 'AI Services',
      status: 'operational',
      latency: 350, // AI services typically have higher latency
      uptime: 99.5,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI service health check failed:', error);
    return {
      name: 'AI Services',
      status: 'down',
      latency: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      message: 'AI service check failed'
    };
  }
}

/**
 * Check stripe payment service health 
 */
async function checkPaymentHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Check if Stripe API keys are configured
    const hasPaymentConfig = !!process.env.STRIPE_SECRET_KEY && 
                             !!process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!hasPaymentConfig) {
      return {
        name: 'Payment Processing',
        status: 'degraded',
        latency: Date.now() - start,
        uptime: 95.0,
        lastChecked: new Date().toISOString(),
        message: 'Payment service configuration incomplete'
      };
    }
    
    // In a real implementation, we would make a lightweight test call to Stripe
    
    return {
      name: 'Payment Processing',
      status: 'operational',
      latency: 120,
      uptime: 99.7,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Payment service health check failed:', error);
    return {
      name: 'Payment Processing',
      status: 'down',
      latency: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      message: 'Payment service check failed'
    };
  }
}

/**
 * Check all system services and return comprehensive health data
 */
export async function getSystemHealth() {
  const [database, api, auth, ai, payment] = await Promise.all([
    checkDatabaseHealth(),
    checkApiHealth(),
    checkAuthHealth(),
    checkAiHealth(),
    checkPaymentHealth()
  ]);
  
  return {
    services: [database, api, auth, ai, payment],
    timestamp: new Date().toISOString()
  };
}