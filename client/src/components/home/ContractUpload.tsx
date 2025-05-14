import { useState } from "react";
import { Link, useLocation } from "wouter";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Shield, Check } from "lucide-react";

const ContractUpload = () => {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

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

    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/api/login";
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

      // Redirect to the contract detail page
      setLocation(`/contract/${data.id}`);
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

  return (
    <section id="upload-contract" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-merriweather font-bold text-center mb-6">
            Upload Your Contract
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Upload your contract to get started with AI-powered analysis and
            answers to your questions.
          </p>

          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".pdf"
            maxSize={25}
          />

          {selectedFile && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3"
              >
                {uploading ? "Uploading..." : "Upload Contract"}
              </Button>
            </div>
          )}

          <div className="mt-12 bg-gray-light rounded-xl p-6">
            <h3 className="text-xl font-merriweather font-bold mb-4 flex items-center">
              <Shield className="text-primary mr-2" />
              Your Contract is Secure
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="text-accent h-5 w-5 mt-1 mr-2" />
                <span>Your contract is encrypted and stored securely</span>
              </li>
              <li className="flex items-start">
                <Check className="text-accent h-5 w-5 mt-1 mr-2" />
                <span>
                  Only you have access to your contract and conversation history
                </span>
              </li>
              <li className="flex items-start">
                <Check className="text-accent h-5 w-5 mt-1 mr-2" />
                <span>We never share your data with third parties</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContractUpload;
