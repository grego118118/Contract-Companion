import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, ShieldAlert, AlertCircle } from 'lucide-react';

const SubscriptionBanner = () => {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['/api/subscription'],
    retry: false,
  });

  if (isLoading || !subscription) {
    return null;
  }

  // If user has an active subscription, don't show the banner
  if (subscription.status === 'active') {
    return null;
  }

  if (subscription.status === 'trial') {
    const daysLeft = subscription.daysLeft || 0;
    
    return (
      <Alert className="bg-blue-50 border-blue-200 mb-6">
        <Clock className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-800">
          Free Trial Period
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          {daysLeft > 1 ? (
            <>You have <span className="font-bold">{daysLeft} days</span> remaining in your free trial.</>
          ) : daysLeft === 1 ? (
            <>You have <span className="font-bold">1 day</span> remaining in your free trial.</>
          ) : (
            <>Your free trial ends today.</>
          )}
          {' '}
          <Link href="/subscription" className="font-medium underline">
            Upgrade now
          </Link> to continue using all features after your trial ends.
        </AlertDescription>
      </Alert>
    );
  }

  if (subscription.status === 'trial_expired') {
    return (
      <Alert className="bg-amber-50 border-amber-200 mb-6">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800">
          Trial Period Expired
        </AlertTitle>
        <AlertDescription className="text-amber-700 flex flex-col sm:flex-row sm:items-center gap-4">
          <span>Your free trial has ended. Subscribe now to continue using all features.</span>
          <Button asChild size="sm" className="sm:ml-2 bg-amber-600 hover:bg-amber-700">
            <Link href="/subscription">
              Subscribe Now
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (subscription.status === 'canceling') {
    return (
      <Alert className="bg-slate-50 border-slate-200 mb-6">
        <AlertCircle className="h-5 w-5 text-slate-600" />
        <AlertTitle className="text-slate-800">
          Subscription Ending Soon
        </AlertTitle>
        <AlertDescription className="text-slate-700">
          Your subscription has been canceled and will end at the end of the current billing period.
          {' '}
          <Link href="/subscription" className="font-medium underline">
            Reactivate
          </Link> to maintain access to all features.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default SubscriptionBanner;