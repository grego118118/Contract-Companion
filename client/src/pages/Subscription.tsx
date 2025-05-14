import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Redirect } from 'wouter';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
    });
    
    if (error) {
      setErrorMessage(error.message || 'An unknown error occurred');
      toast({
        title: 'Payment failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-sm text-red-600">{errorMessage}</div>
      )}
      
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get subscription status
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['/api/subscription'],
    enabled: !!user,
  });
  
  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/subscription');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: 'Subscription canceled',
        description: 'Your subscription will end at the current billing period',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Could not cancel subscription',
        variant: 'destructive',
      });
    },
  });
  
  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      cancelSubscription.mutate();
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>No subscription information available</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Your Subscription</CardTitle>
          {subscription.status === 'active' && (
            <Badge className="bg-green-600">Active</Badge>
          )}
          {subscription.status === 'trial' && (
            <Badge className="bg-blue-600">Trial</Badge>
          )}
          {subscription.status === 'trial_expired' && (
            <Badge variant="destructive">Expired</Badge>
          )}
          {subscription.status === 'canceling' && (
            <Badge variant="outline">Canceling</Badge>
          )}
        </div>
        <CardDescription>
          ContractCompanion Pro Plan - $19.99/month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscription.status === 'trial' && (
          <div className="mb-4">
            <p className="font-medium">
              Your free trial ends in {subscription.daysLeft} days
            </p>
            <p className="text-sm text-gray-500">
              On {new Date(subscription.trialEndsAt).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {subscription.status === 'active' && (
          <div className="mb-4">
            <p className="font-medium">
              Your subscription renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {subscription.status === 'trial_expired' && (
          <div className="mb-4">
            <p className="text-sm">
              Your free trial has ended. Subscribe now to continue using all features.
            </p>
          </div>
        )}
        
        {subscription.status === 'canceling' && (
          <div className="mb-4">
            <p className="text-sm">
              Your subscription has been canceled but you still have access until the end of the current billing period.
            </p>
          </div>
        )}
      </CardContent>
      
      {(subscription.status === 'active' || subscription.status === 'canceling') && (
        <CardFooter>
          {subscription.status === 'active' && (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

const NewSubscription = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Create a subscription
    const createSubscription = async () => {
      try {
        const response = await apiRequest('POST', '/api/subscription');
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Could not create subscription',
          variant: 'destructive',
        });
      }
    };
    
    createSubscription();
  }, [toast]);
  
  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setting up your subscription</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribe to ContractCompanion Pro</CardTitle>
        <CardDescription>
          $19.99/month after your 7-day free trial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm />
        </Elements>
      </CardContent>
      <CardFooter className="flex-col items-start">
        <p className="text-sm text-gray-500 mt-4">
          By subscribing, you agree to the terms of service and privacy policy.
          Your subscription will automatically renew each month until canceled.
        </p>
      </CardFooter>
    </Card>
  );
};

const SubscriptionPage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
  });
  
  // Handle authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/api/login" />;
  }
  
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      
      {isLoadingSubscription ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-8">
          {subscription && (
            <SubscriptionStatus />
          )}
          
          {(!subscription || 
            subscription.status === 'trial_expired' || 
            subscription.status === 'canceled') && (
            <NewSubscription />
          )}
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">ContractCompanion Pro Benefits</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Unlimited contract uploads and analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Advanced AI interpretation of legal language</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Priority support from our team</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Early access to new features</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;