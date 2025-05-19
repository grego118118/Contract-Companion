import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Redirect } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import SubscriptionFeatures from '@/components/subscription/SubscriptionFeatures';
import SubscriptionPlans from './SubscriptionPlans';
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
import { Loader2, CheckIcon } from 'lucide-react';

// Initialize Stripe with the public key
const PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log('Initializing Stripe with public key:', PUBLIC_KEY);
const stripePromise = loadStripe(PUBLIC_KEY);

// Plan details with Stripe price IDs
const PRICE_IDS = {
  basic: 'price_basic',      // Replace with actual Stripe price IDs
  standard: 'price_standard',
  premium: 'price_premium'
};

const PLAN_NAMES: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium'
};

const PLAN_PRICES: Record<string, string> = {
  basic: '$9.99',
  standard: '$19.99',
  premium: '$29.99'
};

interface CheckoutFormProps {
  planId: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ planId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleCheckout = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Create checkout session on the server using our standardized API request function
      const response = await apiRequest('POST', '/api/create-checkout-session', { 
        plan: planId 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      
      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe's checkout page
      window.location.href = checkoutUrl;
    } catch (e: any) {
      console.error('Checkout error:', e);
      setErrorMessage(e.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: e.message || 'Please try again',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="text-sm text-red-600 p-2 bg-red-50 rounded">{errorMessage}</div>
      )}
      
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </span>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </div>
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
  
  // Upgrade subscription mutation
  const [, setLocation] = useLocation();
  const handleUpgrade = () => {
    setLocation('/subscription?upgrade=true');
  };
  
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
  
  // Get plan details
  const planId = subscription.planId || 'standard';
  const planName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || 'Standard';
  const planPrice = PLAN_PRICES[planId as keyof typeof PLAN_PRICES] || '$19.99';
  
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
          ContractCompanion {planName} Plan - {planPrice}/month
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
      
      {(subscription.status === 'active' || subscription.status === 'canceling' || subscription.status === 'trial') && (
        <CardFooter className="flex space-x-4 flex-wrap">
          {subscription.status === 'active' && planId !== 'premium' && (
            <Button 
              onClick={handleUpgrade}
            >
              Upgrade Plan
            </Button>
          )}
          
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

const NewSubscription = ({ selectedPlan = 'standard' }: { selectedPlan?: string }) => {
  const [planId, setPlanId] = useState<string>(selectedPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handlePlanSelect = (newPlanId: string) => {
    setPlanId(newPlanId);
  };
  
  const planName = PLAN_NAMES[planId] || 'Standard';
  const planPrice = PLAN_PRICES[planId] || '$19.99';
  
  if (error) {
    return (
      <div className="space-y-8">
        <SubscriptionPlans onPlanSelect={handlePlanSelect} selectedPlan={planId} />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Subscription Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <SubscriptionPlans onPlanSelect={handlePlanSelect} selectedPlan={planId} />
        
        <Card>
          <CardHeader>
            <CardTitle>Setting up your subscription</CardTitle>
            <CardDescription>Please wait while we prepare your payment details...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <SubscriptionPlans onPlanSelect={handlePlanSelect} selectedPlan={planId} />
      
      <Card>
        <CardHeader>
          <CardTitle>Subscribe to ContractCompanion {planName}</CardTitle>
          <CardDescription>
            {planPrice}/month after your 7-day free trial
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="py-6 mb-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-slate-50">
                <h3 className="font-medium mb-2">Plan Details</h3>
                <ul className="space-y-2">
                  {planId === 'basic' && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>20 queries per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>1 contract upload</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>7-day chat history</span>
                      </li>
                    </>
                  )}
                  {planId === 'standard' && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>50 queries per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>3 contract uploads</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>30-day chat history</span>
                      </li>
                    </>
                  )}
                  {planId === 'premium' && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>Unlimited queries</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>Unlimited contract uploads</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span>Permanent chat history</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              
              <CheckoutForm planId={planId} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start">
          <p className="text-sm text-gray-500 mt-4">
            By subscribing, you agree to the terms of service and privacy policy.
            Your subscription will automatically renew each month until canceled.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

const SubscriptionPage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  // Define strong type for subscription data
  type SubscriptionData = {
    status: 'trial' | 'active' | 'past_due' | 'trial_expired' | 'canceled';
    planId: string;
    daysLeft?: number;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  };
  
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<SubscriptionData>({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
  });
  
  // Get URL parameters from the search query
  const isUpgrading = window.location.search.includes('upgrade=true');
  
  // Extract plan from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const planFromUrl = urlParams.get('plan');
  
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
    <div className="container max-w-5xl py-12 px-4">
      <h1 className="text-3xl font-merriweather font-bold text-center mb-3">ContractCompanion Subscription</h1>
      <p className="text-center text-gray-600 mb-8">Unlock the full power of AI for your union contracts</p>
      
      {isLoadingSubscription ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-8">
          {subscription && !isUpgrading && (
            <div className="subscription-status">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Your Subscription</CardTitle>
                    {subscription.status === 'trial' && (
                      <Badge>Trial</Badge>
                    )}
                    {subscription.status === 'active' && (
                      <Badge className="bg-green-500">Active</Badge>
                    )}
                    {subscription.status === 'past_due' && (
                      <Badge className="bg-yellow-500">Past Due</Badge>
                    )}
                    {subscription.status === 'canceled' && (
                      <Badge variant="destructive">Canceled</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.status === 'trial' && (
                    <div>
                      <p className="font-medium">Your free trial ends in {subscription.daysLeft || 7} days</p>
                      <p className="text-sm text-gray-500">
                        {subscription.trialEndsAt && (
                          <>On {new Date(subscription.trialEndsAt).toLocaleDateString()}</>
                        )}
                      </p>
                      <p className="mt-4">
                        You're currently on the {subscription.planId} plan. 
                        Subscribe now to keep access after your trial ends.
                      </p>
                    </div>
                  )}
                  
                  {subscription.status === 'active' && (
                    <div>
                      <p className="font-medium">Your subscription renews on</p>
                      <p>
                        {subscription.currentPeriodEnd && (
                          <>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {subscription.status === 'canceled' && (
                    <div>
                      <p className="font-medium">Your subscription has been canceled</p>
                      <p className="text-sm text-gray-500">
                        Please subscribe again to continue using premium features.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {(subscription.status === 'trial' || 
                    subscription.status === 'canceled') && (
                    <Button 
                      onClick={() => window.location.replace(`/subscription?upgrade=true&plan=${subscription.planId}`)}
                      className="w-full"
                    >
                      Subscribe Now
                    </Button>
                  )}
                  
                  {subscription.status === 'active' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.replace('/subscription/manage')}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
          
          {(!subscription || 
            (subscription?.status === 'trial_expired') || 
            (subscription?.status === 'canceled') || 
            isUpgrading) && (
            <NewSubscription selectedPlan={planFromUrl || undefined} />
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;