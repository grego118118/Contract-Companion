import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

// Define the available subscription plans
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    description: "For individual union members seeking to understand their rights.",
    features: [
      "Up to 20 AI-powered contract queries per month",
      "Upload and analyze 1 contract",
      "7-day chat history",
      "Basic topic categorization"
    ]
  },
  {
    id: "standard",
    name: "Standard",
    price: "$19.99",
    description: "Perfect for active union members who need comprehensive coverage.",
    features: [
      "Up to 50 AI-powered contract queries per month",
      "Upload and analyze up to 3 contracts",
      "30-day chat history",
      "Save important AI responses"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "$29.99",
    description: "Unlimited access for the most engaged union members.",
    features: [
      "Unlimited AI-powered contract queries",
      "Unlimited contract uploads and analysis",
      "Permanent chat history",
      "Save and organize responses by topic"
    ]
  }
];

export default function Checkout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [match, params] = useRoute('/checkout/:plan?');
  
  // Get the plan from the URL parameter
  const getPlan = () => {
    if (params && params.plan) {
      const foundPlan = PLANS.find(p => p.id === params.plan);
      return foundPlan || null;
    }
    return null;
  };
  
  const selectedPlan = getPlan();

  const handleSubscribe = async (planId: string) => {
    if (processingPlan) return;
    
    setProcessingPlan(planId);
    
    try {
      console.log('Creating checkout session for plan:', planId);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Checkout response:', data);
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Could not start the subscription process. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login and remember where to return
    const returnUrl = `/checkout/${params?.plan || ''}`;
    return <Redirect to={`/api/login?returnTo=${encodeURIComponent(returnUrl)}`} />;
  }

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-merriweather font-bold text-gray-900 mb-4">
          {selectedPlan ? `Subscribe to ${selectedPlan.name}` : 'Choose Your Subscription Plan'}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {selectedPlan ? 
            `You've selected the ${selectedPlan.name} plan. Complete your subscription below.` :
            'Select a plan below to start your 7-day free trial. You can cancel anytime during your trial with no charge.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col h-full ${selectedPlan && selectedPlan.id === plan.id ? 'border-primary border-2' : ''}`}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-3">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${selectedPlan && selectedPlan.id === plan.id ? 'bg-primary' : ''}`} 
                disabled={processingPlan !== null}
                onClick={() => handleSubscribe(plan.id)}
              >
                {processingPlan === plan.id ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  selectedPlan && selectedPlan.id === plan.id ? "Complete Subscription" : "Select Plan"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-gray-500">
          By subscribing, you agree to our terms of service and privacy policy.
          Your subscription will automatically renew after the trial period.
        </p>
      </div>
    </div>
  );
}