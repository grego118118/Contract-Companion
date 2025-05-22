import Stripe from "stripe";
import { Request, Response } from "express";

// Initialize Stripe with the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Subscription pricing tiers in cents
const PLANS = {
  basic: {
    name: "Basic Plan",
    price: 999, // $9.99
    description: "For individual union members"
  },
  standard: {
    name: "Standard Plan",
    price: 1999, // $19.99
    description: "Perfect for active union members"
  },
  premium: {
    name: "Premium Plan",
    price: 2999, // $29.99
    description: "Unlimited access for engaged members"
  }
};

/**
 * Creates a Stripe checkout session for the selected plan
 */
export async function createCheckoutSession(req: Request, res: Response) {
  if (!stripeSecretKey) {
    return res.status(500).json({ 
      error: "Stripe secret key is not configured. Please contact support." 
    });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    // Get plan from request body
    const { plan } = req.body;
    console.log('Processing checkout for plan:', plan);

    // Get the appropriate plan (default to standard if not specified)
    const selectedPlan = plan && PLANS[plan as keyof typeof PLANS] 
      ? PLANS[plan as keyof typeof PLANS] 
      : PLANS.standard;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/pricing`,
      metadata: {
        planId: plan || 'standard',
      },
    });

    // Return checkout URL to the client
    res.status(200).json({
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      error: "Failed to create checkout session. Please try again later."
    });
  }
}