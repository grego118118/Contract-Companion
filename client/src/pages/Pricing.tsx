import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const PricingPage = () => {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handlePlanSelect = (planId: string) => {
    if (isAuthenticated) {
      navigate(`/checkout?plan=${planId}`);
    } else {
      navigate("/api/login");
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

  const unionPlans = [
    {
      name: "Small Union",
      price: "$399",
      description: "For unions with up to 50 members seeking collective contract insights.",
      features: [
        "Shared access for all members (up to 50)",
        "Unlimited AI-powered contract queries",
        "Upload and analyze up to 10 contracts",
        "Custom branding options",
        "Admin dashboard for oversight",
        "Usage analytics and reports"
      ],
      cta: "Contact Us",
      popular: false,
      link: "/contact"
    },
    {
      name: "Medium Union",
      price: "$999",
      description: "Comprehensive solution for unions with 50-200 members.",
      features: [
        "Shared access for all members (up to 200)",
        "Unlimited AI-powered contract queries",
        "Unlimited contract uploads and analysis",
        "Custom onboarding and training",
        "Dedicated account representative",
        "Advanced analytics and reporting",
        "API access for integration"
      ],
      cta: "Contact Us",
      popular: true,
      link: "/contact"
    },
    {
      name: "Large Union",
      price: "Custom",
      description: "Enterprise-grade solution for large unions with specialized needs.",
      features: [
        "Customized member access tiers",
        "Unlimited everything",
        "White-labeled solution",
        "Custom feature development",
        "On-site training sessions",
        "24/7 priority support",
        "Advanced security features"
      ],
      cta: "Contact Us",
      popular: false,
      link: "/contact"
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
      <div className="mb-24">
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

      {/* Union Plans */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-merriweather font-bold text-gray-900 mb-4">
            Union Organization Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive solutions for union organizations to provide contract intelligence to all members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {unionPlans.map((plan) => (
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
                  {plan.name !== "Large Union" && <span className="ml-1 text-gray-500">/month</span>}
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
                  onClick={() => navigate("/contact")}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-24 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-merriweather font-bold text-gray-900 mb-4">
            What Members Are Saying
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <p className="italic text-gray-600 mb-4">
              "As a shop steward, I used to spend hours fielding basic contract questions. Now I direct members to this platform and focus on more complex issues. It's a game-changer for our local."
            </p>
            <p className="font-bold">- Michael T., Union Representative</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <p className="italic text-gray-600 mb-4">
              "I always felt intimidated by our contract's legal language. This tool breaks everything down into simple terms and gives me instant answers. I finally understand my rights and benefits!"
            </p>
            <p className="font-bold">- Sarah L., Union Member</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-merriweather font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">How accurate is the AI analysis?</h3>
            <p className="text-gray-600 mb-6">
              Our AI system is trained specifically on labor contracts and provides highly accurate interpretations. However, for critical matters, we always recommend consulting with your union representative.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">What if I need help using the platform?</h3>
            <p className="text-gray-600 mb-6">
              All plans include access to our support team. Premium and union plans include priority support with faster response times and dedicated representatives.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Can we upload multiple contracts?</h3>
            <p className="text-gray-600 mb-6">
              Yes! Depending on your plan, you can upload one or multiple contracts. This is especially useful for comparing current and previous agreements or reviewing contracts across different departments.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Is my contract data secure?</h3>
            <p className="text-gray-600 mb-6">
              Absolutely. We use enterprise-grade encryption and security protocols. Your contract data is never shared with third parties, and all AI processing is done with strict privacy controls.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
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
          onClick={() => {
            if (isAuthenticated) {
              navigate("/my-contracts");
            } else {
              navigate("/api/login");
            }
          }}
        >
          Start Your 7-Day Free Trial
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          No credit card required. Cancel anytime.
        </p>
      </div>

      {/* SEO Content Section */}
      <div className="mt-24 mb-16 prose prose-blue mx-auto max-w-3xl">
        <h2 className="text-3xl font-merriweather font-bold text-center text-gray-900 mb-8">
          Why Union Members Need Contract Intelligence
        </h2>
        
        <p>
          Union contracts (collective bargaining agreements) are complex legal documents that govern everything from wages and benefits to working conditions and grievance procedures. Yet many union members struggle to understand the full scope of their rights and benefits.
        </p>
        
        <h3>Challenges Union Members Face</h3>
        <p>
          Union members often encounter these common challenges when dealing with their contracts:
        </p>
        <ul>
          <li><strong>Complex Legal Language</strong>: Most contracts are written in dense legal terminology that's difficult for average members to interpret.</li>
          <li><strong>Limited Access to Representatives</strong>: Union representatives are often overwhelmed with cases, making it hard to get quick answers to contract questions.</li>
          <li><strong>Information Gaps</strong>: Many members aren't aware of all the benefits and protections available to them under their contracts.</li>
          <li><strong>Grievance Uncertainty</strong>: Without clear understanding, members may file unnecessary grievances or fail to file legitimate ones.</li>
        </ul>
        
        <h3>How AI Contract Analysis Transforms Union Membership</h3>
        <p>
          Our AI-powered platform addresses these challenges directly by providing:
        </p>
        <ul>
          <li><strong>Plain Language Translations</strong>: Complex contractual terms explained in everyday language that anyone can understand.</li>
          <li><strong>24/7 Accessibility</strong>: Get answers anytime, anywhere, without waiting for a representative to be available.</li>
          <li><strong>Comprehensive Coverage</strong>: Every aspect of your contract is analyzed and accessible, ensuring no benefits or rights are overlooked.</li>
          <li><strong>Empowered Decision-Making</strong>: Make informed decisions about grievances, benefits, and workplace rights with confidence.</li>
        </ul>
      </div>
    </div>
  );
};

export default PricingPage;