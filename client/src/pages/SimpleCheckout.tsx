import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SimpleCheckout() {
  const [location] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract plan from URL path
  const planId = location.split('/').pop() || 'standard';

  const plans = {
    basic: {
      name: "Basic Plan",
      price: "$9.99/month",
      description: "For individual union members"
    },
    standard: {
      name: "Standard Plan",
      price: "$19.99/month",
      description: "Perfect for active union members"
    },
    premium: {
      name: "Premium Plan",
      price: "$29.99/month",
      description: "Unlimited access for engaged members"
    }
  };

  // Get plan details based on URL
  const plan = plans[planId as keyof typeof plans] || plans.standard;

  const createCheckoutSession = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Processing checkout for plan:', planId);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Checkout error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Checkout response data:', data);
      
      if (data && data.checkoutUrl) {
        console.log('Opening checkout URL:', data.checkoutUrl);
        // Open in a new window/tab
        window.open(data.checkoutUrl, '_blank');
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to create checkout session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-16 max-w-3xl px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
        <p className="text-gray-600 mt-2">You're just one step away from accessing ContractCompanion</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{plan.name}</span>
            <span className="text-2xl font-bold text-primary">{plan.price}</span>
          </CardTitle>
          <p className="text-gray-600">{plan.description}</p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium">Your subscription includes:</h3>
              <ul className="mt-2 space-y-2">
                {planId === 'basic' && (
                  <>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Up to 20 AI-powered contract queries per month
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Upload and analyze 1 contract
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      7-day chat history
                    </li>
                  </>
                )}
                
                {planId === 'standard' && (
                  <>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Up to 50 AI-powered contract queries per month
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Upload and analyze up to 3 contracts
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      30-day chat history
                    </li>
                  </>
                )}
                
                {planId === 'premium' && (
                  <>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Unlimited AI-powered contract queries
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Unlimited contract uploads and analysis
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Permanent chat history
                    </li>
                  </>
                )}
                
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  7-day free trial
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Cancel anytime
                </li>
              </ul>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={createCheckoutSession}
            disabled={isProcessing}
            className="w-full py-6 text-lg"
          >
            {isProcessing ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                <span>Processing...</span>
              </span>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
          
          <Link href="/pricing" className="text-center text-sm text-gray-500 hover:text-gray-700">
            ← Back to pricing plans
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}