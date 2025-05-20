import { useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import MyContracts from "@/pages/MyContracts";
import ContractDetail from "@/pages/ContractDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import Subscription from "@/pages/Subscription";
import Checkout from "@/pages/Checkout";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import Dashboard from "@/pages/Dashboard";
import SystemHealth from "@/pages/SystemHealth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/my-contracts" component={MyContracts} />
      <Route path="/contract/:id" component={ContractDetail} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/blog" component={Blog} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/checkout/:plan" component={Checkout} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/system-health" component={SystemHealth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Create a new QueryClient instance inside the component to avoid
  // duplicate declarations from fast refresh
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
