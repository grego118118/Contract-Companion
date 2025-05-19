import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";

// Simple fallback viewer without PDF.js dependencies

interface PDFViewerProps {
  url: string;
  fileName?: string;
}

const PDFViewer = ({ url, fileName = "contract.pdf" }: PDFViewerProps) => {
  return (
    <Card className="w-full shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="sticky top-0 z-10 bg-white border-b flex items-center justify-between p-3">
          <div className="flex items-center">
            <span className="text-sm font-medium">{fileName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </a>
          </div>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center bg-gray-100 min-h-[500px] text-center">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">PDF Preview Unavailable</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            PDF embedding is not available in the browser environment. 
            Please use the buttons above to download or view the PDF in a new tab.
          </p>
          
          <div className="w-full max-w-sm p-6 border rounded-lg bg-white shadow-sm">
            <h4 className="font-medium mb-2 text-primary">Contract Summary</h4>
            <p className="text-sm text-gray-600 mb-4">
              {fileName} contains your union contract with important details about your rights, benefits, and working conditions. 
              Use the AI chat interface to ask specific questions about this document.
            </p>
            <p className="text-xs text-gray-500">
              Uploaded document: {fileName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
