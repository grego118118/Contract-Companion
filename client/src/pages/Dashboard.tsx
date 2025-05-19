import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { Loader2, AlertCircle, PlusCircle, FileText, BarChart3, CreditCard, BookMarked } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from 'date-fns';

// Usage chart
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as ChartTooltip } from 'recharts';

const Dashboard = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isLoading, isAuthenticated]);

  // Get user subscription data
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
  });

  // Get user contracts
  const { data: contracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["/api/contracts"],
    enabled: isAuthenticated,
  });

  // Get user usage data
  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  // Get user's saved chat messages
  const { data: savedChats, isLoading: isLoadingSavedChats } = useQuery({
    queryKey: ["/api/saved-chats"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Handled by useEffect redirect
  }

  // Format subscription status into a more readable form
  const formatSubscriptionStatus = (status: string) => {
    switch (status) {
      case "trialing":
        return "Free Trial";
      case "active":
        return "Active";
      case "past_due":
        return "Past Due";
      case "canceled":
        return "Canceled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Format subscription plan into a more readable form
  const formatPlanName = (planId: string) => {
    switch (planId) {
      case "basic":
        return "Basic Plan";
      case "standard":
        return "Standard Plan";
      case "premium":
        return "Premium Plan";
      default:
        return planId.charAt(0).toUpperCase() + planId.slice(1);
    }
  };

  // Calculate days left in trial or subscription
  const getDaysLeft = () => {
    if (!subscription) return null;

    if (subscription.status === "trialing" && subscription.trialEndsAt) {
      // Use a fixed 7 days for trial if trialEndsAt is not available
      if (!subscription.trialEndsAt) return 7;
      
      return Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    } else if (subscription.currentPeriodEnd) {
      return Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }
    
    // Default to 7 days for trial if we can't calculate it
    return subscription.status === "trialing" ? 7 : null;
  };

  // Create usage chart data
  const getUsageChartData = () => {
    if (!usageData || !usageData.limits) return [];

    const { queriesUsed, maxQueries } = usageData;
    const remaining = Math.max(0, maxQueries - queriesUsed);

    return [
      { name: "Used", value: queriesUsed },
      { name: "Remaining", value: remaining },
    ];
  };

  const usageChartData = getUsageChartData();
  const daysLeft = getDaysLeft();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="contracts">My Contracts</TabsTrigger>
          <TabsTrigger value="saved">Saved Answers</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Subscription Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscription
                </CardTitle>
                <CardDescription>
                  {isLoadingSubscription ? "Loading..." : 
                    subscription ? `${formatPlanName(subscription.planId)} - ${formatSubscriptionStatus(subscription.status)}` : "No subscription"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription && subscription.status === "trialing" && (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      {daysLeft || 7} days left in trial
                    </p>
                    <Progress value={((daysLeft || 7) / 7) * 100} className="h-2" />
                    <div className="mt-4">
                      <Button size="sm" asChild>
                        <Link href="/checkout">Upgrade Now</Link>
                      </Button>
                    </div>
                  </>
                )}
                {subscription && subscription.status === "active" && (
                  <p className="text-sm">
                    Renews in {daysLeft} days
                  </p>
                )}
                {subscription && subscription.status === "past_due" && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment Issue</AlertTitle>
                    <AlertDescription>
                      We couldn't process your latest payment. Please update your payment method.
                    </AlertDescription>
                  </Alert>
                )}
                {!subscription && (
                  <Button size="sm" asChild className="mt-2">
                    <Link href="/subscription">Start Free Trial</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Usage Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Contract Queries
                </CardTitle>
                <CardDescription>
                  {isLoadingUsage ? "Loading usage data..." : "Your query usage this month"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsage ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : usageData ? (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {usageData.queriesUsed} of {usageData.limits.maxQueries === -1 ? "Unlimited" : usageData.limits.maxQueries} queries
                      </span>
                      {usageData.limits.maxQueries !== -1 && (
                        <span className="text-sm font-medium">
                          {Math.floor((usageData.queriesUsed / usageData.limits.maxQueries) * 100)}%
                        </span>
                      )}
                    </div>
                    {usageData.limits.maxQueries !== -1 ? (
                      <Progress 
                        value={(usageData.queriesUsed / usageData.limits.maxQueries) * 100} 
                        className="h-2" 
                      />
                    ) : (
                      <div className="h-8 flex items-center justify-center bg-primary/10 rounded-md">
                        <span className="text-primary font-medium">Unlimited</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No usage data available</p>
                )}
              </CardContent>
            </Card>

            {/* Contracts Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  My Contracts
                </CardTitle>
                <CardDescription>
                  {isLoadingContracts ? "Loading contracts..." : 
                    contracts && contracts.length > 0 
                      ? `You have ${contracts.length} contract${contracts.length !== 1 ? 's' : ''}`
                      : "No contracts uploaded yet"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingContracts ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : contracts && contracts.length > 0 ? (
                  <ul className="space-y-2">
                    {contracts.slice(0, 3).map((contract: any) => (
                      <li key={contract.id} className="text-sm">
                        <Link href={`/contract/${contract.id}`} className="hover:underline text-primary">
                          {contract.name}
                        </Link>
                      </li>
                    ))}
                    {contracts.length > 3 && (
                      <li className="text-sm text-muted-foreground pt-1">
                        +{contracts.length - 3} more
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="text-center p-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/my-contracts">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Upload Contract
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage Charts */}
          {!isLoadingUsage && usageData && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Details</CardTitle>
                  <CardDescription>
                    Your usage statistics for the current billing period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Query Usage Pie Chart */}
                    <div className="h-64">
                      <h3 className="text-sm font-medium mb-3">Query Usage</h3>
                      {usageData.limits.maxQueries !== -1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={usageChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell key="used" fill="#1A237E" />
                              <Cell key="remaining" fill="#E3F2FD" />
                            </Pie>
                            <Legend />
                            <ChartTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-lg font-medium">Unlimited Queries</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Contract Usage */}
                    <div className="h-64">
                      <h3 className="text-sm font-medium mb-3">Contract Usage</h3>
                      <div className="flex flex-col justify-center h-full">
                        <p className="text-2xl font-bold mb-2">
                          {contracts ? contracts.length : 0} / {usageData.limits.maxContracts === -1 ? "∞" : usageData.limits.maxContracts}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {usageData.limits.maxContracts === -1 ? "Unlimited contracts" : "Contracts used"}
                        </p>
                        {usageData.limits.maxContracts !== -1 && (
                          <>
                            <Progress 
                              value={(contracts ? contracts.length : 0) / usageData.limits.maxContracts * 100} 
                              className="h-2 mt-4" 
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              {usageData.limits.maxContracts - (contracts ? contracts.length : 0)} contracts remaining
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SUBSCRIPTION TAB */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>My Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Plan */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Current Plan</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{formatPlanName(subscription.planId)}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Status: <span className={`font-medium ${
                                subscription.status === "past_due" ? "text-red-500" : 
                                subscription.status === "trialing" ? "text-blue-500" : 
                                "text-green-500"
                              }`}>
                                {formatSubscriptionStatus(subscription.status)}
                              </span>
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {subscription.status === "trialing" ? (
                              <p className="text-sm font-medium">Free Trial</p>
                            ) : (
                              <p className="text-sm font-medium">
                                {subscription.planId === "basic" ? "$9.99" : 
                                 subscription.planId === "standard" ? "$19.99" : 
                                 subscription.planId === "premium" ? "$29.99" : ""}/month
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Trial/Billing Period Info */}
                        {subscription.status === "trialing" ? (
                          <div className="mb-4">
                            <p className="text-sm mb-1">Trial ends in {daysLeft} days</p>
                            <Progress value={(daysLeft / 7) * 100} className="h-2" />
                          </div>
                        ) : (
                          <p className="text-sm mb-4">
                            Your next billing date is {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "unknown"}
                          </p>
                        )}
                        
                        {/* Feature List */}
                        <div className="text-sm space-y-2">
                          <p>• {usageData && usageData.limits.maxQueries === -1 ? "Unlimited" : usageData?.limits.maxQueries} queries per month</p>
                          <p>• {usageData && usageData.limits.maxContracts === -1 ? "Unlimited" : usageData?.limits.maxContracts} contracts</p>
                          <p>• {usageData && usageData.limits.chatHistoryDays === -1 ? "Permanent" : `${usageData?.limits.chatHistoryDays}-day`} chat history</p>
                          <p>• {usageData?.limits.modelTier === "premium" ? "Enhanced" : "Standard"} AI model</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Management Options */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Manage Subscription</h3>
                      <div className="space-y-4">
                        {subscription.status === "trialing" && (
                          <Button asChild className="w-full">
                            <Link href="/subscription">
                              Upgrade Now
                            </Link>
                          </Button>
                        )}
                        
                        {subscription.status === "active" && (
                          <>
                            <Button asChild variant="outline" className="w-full">
                              <Link href="/subscription">
                                Change Plan
                              </Link>
                            </Button>
                            
                            <Button 
                              variant="destructive" 
                              className="w-full"
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period.")) {
                                  try {
                                    await apiRequest("POST", "/api/cancel-subscription");
                                    // Invalidate subscription cache to refresh data
                                    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
                                  } catch (error) {
                                    console.error("Error canceling subscription:", error);
                                  }
                                }
                              }}
                            >
                              Cancel Subscription
                            </Button>
                          </>
                        )}
                        
                        {subscription.status === "canceled" && (
                          <Button asChild className="w-full">
                            <Link href="/subscription">
                              Reactivate Subscription
                            </Link>
                          </Button>
                        )}
                        
                        {subscription.status === "past_due" && (
                          <Button asChild className="w-full">
                            <Link href="/subscription">
                              Update Payment Method
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional subscription info */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Billing History</h3>
                    <p className="text-sm text-muted-foreground">
                      To view your billing history or download invoices, please visit your Stripe customer portal.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={async () => {
                      try {
                        const response = await apiRequest("POST", "/api/create-portal-session");
                        const { url } = await response.json();
                        window.open(url, "_blank");
                      } catch (error) {
                        console.error("Error creating portal session:", error);
                      }
                    }}>
                      Access Billing Portal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">You don't have an active subscription.</p>
                  <Button asChild>
                    <Link href="/subscription">Start Free Trial</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTRACTS TAB */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Contracts</CardTitle>
                <CardDescription>
                  Manage your uploaded contracts
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/my-contracts">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Upload New
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingContracts ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : contracts && contracts.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contract Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Uploaded</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">File Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {contracts.map((contract: any) => (
                        <tr key={contract.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link href={`/contract/${contract.id}`} className="text-primary hover:underline font-medium">
                              {contract.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {new Date(contract.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {Math.round(contract.fileSize / 1024)} KB
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                                <Link href={`/contract/${contract.id}`}>
                                  View
                                </Link>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (window.confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
                                    try {
                                      await apiRequest("DELETE", `/api/contracts/${contract.id}`);
                                      // Invalidate contracts cache to refresh the list
                                      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
                                    } catch (error) {
                                      console.error("Error deleting contract:", error);
                                    }
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first contract to start analyzing it with AI
                  </p>
                  <Button asChild>
                    <Link href="/my-contracts">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Upload Contract
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAVED ANSWERS TAB */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookMarked className="w-5 h-5 mr-2" />
                Saved Answers
              </CardTitle>
              <CardDescription>
                Important contract answers you've saved for future reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSavedChats ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : savedChats && savedChats.length > 0 ? (
                <div className="space-y-4">
                  {savedChats.map((chat: any) => (
                    <div key={chat.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {chat.contractName || "Unknown Contract"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm font-medium mb-1">Q: {chat.userQuestion}</p>
                        <p className="text-sm text-muted-foreground">A: {chat.assistantResponse}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <Link href={`/contract/${chat.contractId}`} className="text-xs text-primary hover:underline">
                          View in context
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={async () => {
                            if (window.confirm("Remove this saved answer?")) {
                              try {
                                await apiRequest("POST", `/api/chats/${chat.id}/unsave`);
                                // Invalidate saved chats to refresh the list
                                queryClient.invalidateQueries({ queryKey: ["/api/saved-chats"] });
                              } catch (error) {
                                console.error("Error removing saved chat:", error);
                              }
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <BookMarked className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No saved answers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    When chatting with your contracts, click the bookmark icon to save important answers
                  </p>
                  <Button asChild>
                    <Link href="/my-contracts">
                      View My Contracts
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;