import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, X, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseAdvancedCSV } from "@/lib/smart-csv-parser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

export default function FileUploadZone() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (transactions: any[]) => {
      const response = await apiRequest("POST", "/api/transactions/bulk", transactions);
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("Upload successful, uploaded transactions:", data?.length || 0);
      
      toast({
        title: "Upload Complete!",
        description: `${data?.length || 0} transactions uploaded successfully! The page will refresh to show your data.`,
      });
      
      // Immediate hard refresh to bypass all caching
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload transactions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const processFile = useCallback(async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    setUploadedFiles(prev => [...prev, {
      file,
      progress: 0,
      status: "uploading"
    }]);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFiles(prev => prev.map(f => 
          f.file === file ? { ...f, progress: i } : f
        ));
      }

      // Update status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.file === file ? { ...f, status: "processing" } : f
      ));

      // Parse the file
      const transactions = await parseAdvancedCSV(file);
      
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in file");
      }

      console.log("Parsed transactions:", transactions);

      // Upload to server
      await uploadMutation.mutateAsync(transactions);

      // Mark as completed
      setUploadedFiles(prev => prev.map(f => 
        f.file === file ? { ...f, status: "completed" } : f
      ));

    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.file === file ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : "Failed to process file"
        } : f
      ));
    }
  }, [uploadMutation]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(processFile);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Main Upload Button */}
      <div className="text-center">
        <div 
          {...getRootProps()} 
          className="inline-block"
        >
          <input {...getInputProps()} />
          <Button 
            size="lg"
            className={cn(
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105",
              isDragActive && "scale-105 shadow-xl"
            )}
          >
            <CloudUpload className="w-6 h-6 mr-3" />
            {isDragActive ? "Drop Files Here!" : "Choose Files to Upload"}
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Supported file formats:</p>
          <div className="flex items-center justify-center space-x-6">
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1 text-green-600" />
              CSV Files
            </span>
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1 text-blue-600" />
              Excel Files
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB per file</p>
        </div>
      </div>

      {/* Alternative: Drag & Drop Area */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">or drag and drop files below</span>
        </div>
      </div>

      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
          isDragActive 
            ? "border-blue-400 bg-blue-50 scale-105" 
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isDragActive ? "bg-blue-100" : "bg-gray-100"
          )}>
            <CloudUpload className={cn(
              "w-6 h-6",
              isDragActive ? "text-blue-600" : "text-gray-400"
            )} />
          </div>
          <div>
            <p className="text-base font-medium text-gray-900">
              {isDragActive ? "Drop your files here!" : "Drag files here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              CSV and Excel files accepted
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((uploadedFile, index) => (
            <div key={index} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">
                    {uploadedFile.file.name}
                  </span>
                  {uploadedFile.status === "completed" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.file)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {uploadedFile.status !== "completed" && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>
                      {uploadedFile.status === "uploading" && "Uploading..."}
                      {uploadedFile.status === "processing" && "Processing..."}
                      {uploadedFile.status === "error" && "Error"}
                    </span>
                    {uploadedFile.status === "uploading" && (
                      <span>{uploadedFile.progress}%</span>
                    )}
                  </div>
                  <Progress 
                    value={uploadedFile.status === "uploading" ? uploadedFile.progress : 100} 
                    className="h-2"
                  />
                </div>
              )}

              {uploadedFile.status === "error" && uploadedFile.error && (
                <p className="text-sm text-red-600 mt-2">{uploadedFile.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
