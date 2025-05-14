import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Calendar, History, Trash2 } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const MyContracts = () => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/contracts"],
    enabled: isAuthenticated,
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a contract file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("contract", selectedFile);

      const response = await fetch("/api/contracts/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload contract");
      }

      const data = await response.json();

      toast({
        title: "Contract uploaded successfully",
        description: "Your contract is now being analyzed",
      });

      // Invalidate contracts query
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });

      // Reset state
      setSelectedFile(null);
      setUploadMode(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await apiRequest("DELETE", `/api/contracts/${contractId}`);
      
      toast({
        title: "Contract deleted",
        description: "Your contract has been successfully deleted",
      });
      
      // Invalidate contracts query
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-merriweather text-center">
              Sign In Required
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-center mb-6">
              Please sign in to view and manage your contracts.
            </p>
            <a
              href="/api/login"
              className="bg-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-primary/90 transition"
            >
              Sign In
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-merriweather font-bold">My Contracts</h1>
        <Button
          onClick={() => setUploadMode(!uploadMode)}
          className="bg-primary hover:bg-primary/90"
        >
          {uploadMode ? "Cancel" : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Upload Contract
            </>
          )}
        </Button>
      </div>
      
      <SubscriptionBanner />

      {uploadMode ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-merriweather font-bold mb-4">
              Upload New Contract
            </h2>
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".pdf"
              maxSize={25}
            />

            {selectedFile && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {uploading ? "Uploading..." : "Upload Contract"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Contracts</TabsTrigger>
          <TabsTrigger value="archived">Archived Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : contracts && contracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contracts.map((contract: any) => (
                <Card key={contract.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <FileText className="text-primary mr-3 h-6 w-6" />
                          <h3 className="font-merriweather font-bold text-lg line-clamp-1">
                            {contract.name}
                          </h3>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-secondary">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this contract? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-secondary text-white hover:bg-secondary/90"
                                onClick={() => handleDeleteContract(contract.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="flex flex-col space-y-2 mb-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            Uploaded on {new Date(contract.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <History className="h-4 w-4 mr-2" />
                          <span>
                            {contract.conversationCount || 0} conversations
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => window.open(contract.fileUrl, '_blank')}
                        >
                          View PDF
                        </Button>
                        <Button
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => setLocation(`/contract/${contract.id}`)}
                        >
                          Chat About Contract
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-10">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-merriweather font-semibold mb-2">
                  No contracts found
                </h3>
                <p className="text-gray-500 mb-6 text-center">
                  Upload your first contract to get started with AI analysis
                </p>
                <Button
                  onClick={() => setUploadMode(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" /> Upload Contract
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardContent className="flex flex-col items-center py-10">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-merriweather font-semibold mb-2">
                No archived contracts
              </h3>
              <p className="text-gray-500 text-center">
                Archived contracts will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyContracts;
