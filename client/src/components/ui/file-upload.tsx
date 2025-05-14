import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  multiple?: boolean;
}

const FileUpload = ({
  onFileSelect,
  accept = ".pdf",
  maxSize = 25,
  className = "",
  multiple = false,
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (accept && !accept.split(",").some(type => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else {
        return file.type.match(type);
      }
    })) {
      toast({
        title: "Invalid file type",
        description: `Please upload a ${accept} file.`,
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size should not exceed ${maxSize}MB.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <div
          className={`contract-upload-area rounded-xl p-8 flex flex-col items-center justify-center text-center ${
            dragActive ? "border-primary bg-blue-50" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            onChange={handleChange}
            accept={accept}
            type="file"
            multiple={multiple}
            className="hidden"
          />
          
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-merriweather font-semibold mb-2">
            Drag and drop your PDF contract here
          </h3>
          <p className="text-gray-500 mb-6">or</p>
          <Button
            onClick={handleButtonClick}
            className="bg-primary hover:bg-primary/90 text-white font-source font-semibold"
          >
            Browse Files
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            Maximum file size: {maxSize}MB
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center">
            <File className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="font-semibold">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
