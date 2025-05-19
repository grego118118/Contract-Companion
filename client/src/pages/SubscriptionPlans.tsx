import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CheckIcon } from 'lucide-react';

// Plan details for all the tiers
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    description: 'Perfect for individual union members seeking to understand their rights.',
    features: [
      'Up to 20 AI-powered contract queries per month',
      'Upload and analyze 1 contract',
      '7-day chat history',
      'Basic topic categorization',
      'Mobile-friendly interface'
    ],
    recommended: false
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$19.99',
    description: 'Perfect for active union members who need comprehensive coverage.',
    features: [
      'Up to 50 AI-powered contract queries per month',
      'Upload and analyze up to 3 contracts',
      '30-day chat history',
      'Save important AI responses',
      'Advanced topic categorization',
      'Export chat transcripts as PDF'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29.99',
    description: 'Unlimited access for the most engaged union members.',
    features: [
      'Unlimited AI-powered contract queries',
      'Unlimited contract uploads and analysis',
      'Permanent chat history',
      'Save and organize responses by topic',
      'Contract comparison tools',
      'Priority support response',
      'Advanced analytics dashboard'
    ],
    recommended: false
  }
];

interface SubscriptionPlansProps {
  onPlanSelect: (planId: string) => void;
  selectedPlan?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  onPlanSelect, 
  selectedPlan = 'standard' 
}) => {
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<string>(selectedPlan);
  
  const handleSelect = (planId: string) => {
    setSelected(planId);
    onPlanSelect(planId);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-merriweather font-bold mb-3">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that best fits your needs.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`flex flex-col border-2 transition-all ${
            selected === plan.id 
              ? 'border-primary shadow-lg'
              : 'border-gray-200 hover:border-gray-300'
          } ${plan.recommended ? 'relative' : ''}`}>
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-bold uppercase rounded-bl-lg">
                Recommended
              </div>
            )}
            
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button
                variant={selected === plan.id ? "default" : "outline"}
                className="w-full"
                onClick={() => handleSelect(plan.id)}
              >
                {selected === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;