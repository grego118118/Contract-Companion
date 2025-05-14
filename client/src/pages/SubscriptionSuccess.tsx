import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SubscriptionSuccess = () => {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Invalidate subscription query to fetch the latest data
    queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
  }, [queryClient]);
  
  return (
    <div className="container max-w-3xl py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl font-merriweather">Subscription Successfully Activated!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for subscribing to ContractCompanion Pro
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Your subscription has been successfully activated. You now have full access to all ContractCompanion Pro features including:
            </p>
            <ul className="text-left mx-auto max-w-md space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Unlimited contract uploads and AI-powered analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Advanced contract Q&A with unlimited queries</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Premium educational content and resources</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setLocation('/subscription')}>
              Manage Subscription
            </Button>
            <Button variant="outline" asChild>
              <Link href="/my-contracts">Continue to My Contracts</Link>
            </Button>
          </div>
          <div className="pt-4 text-sm text-gray-500">
            If you have any questions or need assistance, please contact our support team.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;