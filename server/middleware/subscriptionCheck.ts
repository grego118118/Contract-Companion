import { RequestHandler } from 'express';
import { storage } from '../storage';

/**
 * Middleware to check if a user has an active subscription or is still in trial period
 */
export const checkSubscription: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = req.user.claims.sub;
  const user = await storage.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // Allow access if the user has an active subscription
  if (user.subscriptionStatus === "active") {
    return next();
  }
  
  // Allow access if user is on trial that hasn't expired
  if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
    const now = new Date();
    if (now < user.trialEndsAt) {
      return next();
    }
    
    // If trial has expired, update the user's status
    await storage.updateUserSubscription(userId, {
      subscriptionStatus: "trial_expired"
    });
    
    return res.status(403).json({
      message: "Trial period has expired",
      subscriptionRequired: true
    });
  }
  
  // Check if user is on the "trialing" status (from Stripe)
  if (user.subscriptionStatus === "trialing" && user.stripeSubscriptionId) {
    return next();
  }
  
  // For new users, start a trial period
  if (!user.subscriptionStatus) {
    // Set trial period for 7 days
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    
    await storage.updateUserSubscription(userId, {
      subscriptionStatus: "trial",
      trialEndsAt: trialEnd
    });
    
    return next();
  }
  
  // Otherwise, subscription is required
  return res.status(403).json({
    message: "Subscription required",
    subscriptionRequired: true
  });
};