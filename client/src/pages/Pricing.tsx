import React from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const PricingPage = () => {
  const { isAuthenticated } = useAuth();

  // Simple function to handle plan selection
  const handlePlanSelect = (planId: string) => {
    if (isAuthenticated) {
      // Go directly to DirectCheckout component with plan ID
      window.location.href = `/checkout/${planId}`;
    } else {
      // For not authenticated users, redirect to login 
      window.location.href = `/api/login`;
    }
  };

  const individualPlans = [
    {
      name: "Basic",
      price: "$9.99",
      description: "For individual union members seeking to understand their rights.",
      features: [
        "Up to 20 AI-powered contract queries per month",
        "Upload and analyze 1 contract",
        "7-day chat history",
        "Basic topic categorization",
        "Mobile-friendly interface"
      ],
      cta: "Get Started",
      popular: false,
      planId: "basic"
    },
    {
      name: "Standard",
      price: "$19.99",
      description: "Perfect for active union members who need comprehensive coverage.",
      features: [
        "Up to 50 AI-powered contract queries per month",
        "Upload and analyze up to 3 contracts",
        "30-day chat history",
        "Save important AI responses",
        "Advanced topic categorization",
        "Export chat transcripts as PDF"
      ],
      cta: "Choose Standard",
      popular: true,
      planId: "standard"
    },
    {
      name: "Premium",
      price: "$29.99",
      description: "Unlimited access for the most engaged union members.",
      features: [
        "Unlimited AI-powered contract queries",
        "Unlimited contract uploads and analysis",
        "Permanent chat history",
        "Save and organize responses by topic",
        "Contract comparison tools",
        "Priority support response",
        "Advanced analytics dashboard"
      ],
      cta: "Choose Premium",
      popular: false,
      planId: "premium"
    }
  ];

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-merriweather font-bold text-gray-900 mb-4">
          Empower Your Union With Contract Intelligence
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transform complex legal language into clear, actionable insights. 
          Our AI-powered platform helps union members and representatives understand 
          and leverage their contracts for maximum benefit.
        </p>
      </div>

      {/* Value Proposition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-primary mb-3">Save Valuable Time</h3>
          <p className="text-gray-600">
            Get instant answers to contract questions instead of searching through pages of legalese or waiting for representatives to respond.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-primary mb-3">Increase Member Knowledge</h3>
          <p className="text-gray-600">
            Empower every member with a deep understanding of their rights, benefits, and protections under your collective agreement.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-primary mb-3">Reduce Grievance Costs</h3>
          <p className="text-gray-600">
            Prevent unnecessary grievances by ensuring everyone clearly understands contract terms, saving time and resources.
          </p>
        </div>
      </div>

      {/* Individual Plans */}
      <div className="mb-24" id="individual-plans">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-merriweather font-bold text-gray-900 mb-4">
            Individual Member Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Perfect for union members who want to understand their contracts and rights.
            Starts with a 7-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {individualPlans.map((plan) => (
            <Card 
              key={plan.name}
              className={`flex flex-col h-full ${plan.popular ? 'border-primary border-2 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="bg-primary text-white text-center py-1 font-medium text-sm">
                  Most Popular
                </div>
              )}
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
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                  onClick={() => handlePlanSelect(plan.planId)}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Simple CTA */}
      <div className="bg-gray-50 rounded-xl p-12 text-center mt-16">
        <h2 className="text-3xl font-merriweather font-bold text-gray-900 mb-4">
          Start Empowering Your Members Today
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Join thousands of union members who are already benefiting from clear, instant contract insights.
        </p>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90"
          onClick={() => handlePlanSelect("standard")}
        >
          Start Your 7-Day Free Trial
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;