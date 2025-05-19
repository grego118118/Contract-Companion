import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat/ChatInterface";
import PDFViewer from "@/components/ui/pdf-viewer";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { FileText, ChevronLeft } from "lucide-react";

const ContractDetail = ({ params }: { params: { id: string } }) => {
  const contractId = params.id;
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Get tab from URL query parameter
  const getTabFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    return tab === 'view' ? 'view' : 'chat'; // Default to chat if not specified or invalid
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromURL());

  // Fetch contract data
  const {
    data: contract,
    isLoading: contractLoading,
    error,
  } = useQuery({
    queryKey: [`/api/contracts/${contractId}`],
    enabled: isAuthenticated && !!contractId,
  });

  // Fetch chat history
  const {
    data: chatHistory,
    isLoading: chatHistoryLoading,
  } = useQuery({
    queryKey: [`/api/contracts/${contractId}/chat`],
    enabled: isAuthenticated && !!contractId,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contract. It may have been deleted or you may not have permission to view it.",
        variant: "destructive",
      });
      setLocation("/my-contracts");
    }
  }, [error, toast, setLocation]);

  if (authLoading || contractLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-merriweather font-bold mb-4">
          Sign In Required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to view and analyze this contract.
        </p>
        <a
          href="/api/login"
          className="bg-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-primary/90 transition"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (!contract) {
    return null; // Error handled by useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/my-contracts")}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to My Contracts
        </Button>
        <h1 className="text-2xl font-merriweather font-bold">{contract.name}</h1>
      </div>
      
      <SubscriptionBanner />

      <Tabs
        defaultValue="chat"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="chat">Chat with AI</TabsTrigger>
          <TabsTrigger value="view">View Contract</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="h-[calc(100vh-220px)]">
          <ChatInterface
            contractId={contractId}
            contractName={contract.name}
            chatHistory={chatHistory}
          />
        </TabsContent>

        <TabsContent value="view">
          <PDFViewer url={`/api/contracts/${contractId}/file`} fileName={contract.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractDetail;
