"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/components/upload-button";
import { FileText, FileImage, Trash2, ShieldCheck, AlertCircle, CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  "Degree / Diploma",
  "Professional License",
  "Certification",
  "ID Proof",
  "Resume / CV",
  "Other"
];

export function DocumentsSection({ documents, setDocuments }) {
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const removeDoc = (index) => setDocuments(documents.filter((_, i) => i !== index));

  const getFileIcon = (type) => {
    // Safe fallback for old/missing data
    const safeType = (type || "").toLowerCase();
    if (safeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileImage className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
      
      {/* HEADER */}
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg text-zinc-900">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    Credentials
                </CardTitle>
                <CardDescription className="text-sm">
                    Upload verifiable documents to boost your trust score.
                </CardDescription>
            </div>
            
            {/* Status Badge - Mobile Optimized */}
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-semibold w-fit shrink-0">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Verification Required</span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        
        {/* 1. UPLOAD FORM (Responsive Stack) */}
        <div className="p-4 sm:p-6 md:p-8 bg-zinc-50/30 border-b border-zinc-100">
            <h4 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wide">Add New Document</h4>
            
            {/* Grid: 1 col on mobile, 2 cols on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                {/* 1. Name */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Document Name</Label>
                    <Input 
                        value={docName} 
                        onChange={(e) => setDocName(e.target.value)} 
                        placeholder="e.g. Medical License"
                        className="bg-white border-zinc-200 h-11 focus:ring-indigo-500 text-base md:text-sm" // Larger text on mobile
                    />
                </div>

                {/* 2. Category */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Category</Label>
                    <Select value={docCategory} onValueChange={setDocCategory}>
                        <SelectTrigger className="bg-white border-zinc-200 h-11 w-full focus:ring-indigo-500 text-base md:text-sm">
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. Upload Button (Spans Full Width) */}
                <div className="md:col-span-2 relative mt-2">
                    <div className={cn(
                        "transition-all duration-300",
                        (!docName || !docCategory) ? "opacity-60 grayscale cursor-not-allowed" : "opacity-100"
                    )}>
                        <UploadButton 
                            endpoint="expertDocument" 
                            onUploadBegin={() => setIsUploading(true)}
                            onClientUploadComplete={(res) => {
                                if(res?.[0]) {
                                    setDocuments([...documents, { 
                                        title: docName, 
                                        category: docCategory,
                                        url: res[0].url, 
                                        fileType: res[0].name.endsWith(".pdf") ? "pdf" : "image",
                                        fileSize: (res[0].size / 1024 / 1024).toFixed(2) + " MB"
                                    }]);
                                    setDocName("");
                                    setDocCategory("");
                                    toast.success("Document attached successfully");
                                }
                                setIsUploading(false);
                            }}
                            onUploadError={(error) => {
                                toast.error(`Upload failed: ${error.message}`);
                                setIsUploading(false);
                            }}
                            appearance={{
                                button: { 
                                    width: "100%",
                                    background: isUploading ? "#f4f4f5" : "#18181b", 
                                    color: isUploading ? "#71717a" : "white", 
                                    height: "44px", // Touch target size
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    borderRadius: "8px",
                                    border: isUploading ? "1px solid #e4e4e7" : "none",
                                    cursor: (!docName || !docCategory) ? "not-allowed" : "pointer"
                                },
                                container: { display: "block", width: "100%" },
                                allowedContent: { display: "none" } 
                            }}
                            content={{ 
                                button: isUploading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CloudUpload className="h-4 w-4" /> Upload Document
                                    </div>
                                ) 
                            }}
                            disabled={!docName || !docCategory}
                        />
                    </div>
                    
                    {/* Helper Tooltip */}
                    {(!docName || !docCategory) && !isUploading && (
                        <p className="absolute -top-6 left-0 w-full text-center text-[10px] text-orange-600 font-medium animate-in fade-in slide-in-from-bottom-1">
                            * Enter details to enable upload
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* 2. DOCUMENT LIST */}
        <div className="p-4 sm:p-6 md:p-8">
            {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, idx) => (
                        <div key={idx} className="group flex items-center justify-between p-3 sm:p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                {/* Icon Box */}
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                    {getFileIcon(doc.fileType || doc.type)}
                                </div>
                                
                                {/* Text Content */}
                                <div className="min-w-0 flex flex-col">
                                    <span className="text-sm font-bold text-zinc-900 truncate" title={doc.title}>
                                        {doc.title}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                            {doc.category || "General"}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            {(doc.fileType || doc.type || "FILE").toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Delete Button */}
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeDoc(idx)} 
                                className="text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-colors h-9 w-9 rounded-lg shrink-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                /* EMPTY STATE */
                <div className="text-center py-10 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/20">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50 border border-zinc-200 mb-3">
                        <FileText className="h-6 w-6 text-zinc-300" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900">No documents yet</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 px-4">
                        Your profile needs at least one verified document to go live.
                    </p>
                </div>
            )}
        </div>

      </CardContent>
    </Card>
  );
}