"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/components/upload-button";
import { FileText, FileImage, Trash2, ShieldCheck, AlertCircle, CloudUpload, Loader2, CheckCircle2 } from "lucide-react";
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

export function DocumentsSection({ documents, setDocuments, errors = {} }) {
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const removeDoc = (index) => setDocuments(documents.filter((_, i) => i !== index));

  const getFileIcon = (type) => {
    // Handle legacy data safely
    const safeType = (type || "").toLowerCase();
    if (safeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileImage className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* GLOBAL ERROR FOR DOCUMENTS */}
      {errors.documents && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-pulse">
            <AlertCircle className="h-4 w-4" />
            {typeof errors.documents === 'string' ? errors.documents : "Please provide the required documents."}
        </div>
      )}

      <Card className={cn("border-zinc-200 shadow-sm bg-white overflow-hidden", errors.documents && "border-red-300 ring-1 ring-red-100")}>
        
        {/* HEADER */}
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 pb-6 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 font-bold">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        Credentials & Verification
                    </CardTitle>
                    <CardDescription>
                        Upload verifiable documents to boost your trust score.
                    </CardDescription>
                </div>
                
                {/* Global Status Badge */}
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border",
                    documents.length > 0 
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                )}>
                    {documents.length > 0 ? (
                        <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Pending Verification</span>
                        </>
                    ) : (
                        <span>No Documents</span>
                    )}
                </div>
            </div>
        </CardHeader>
        
        <CardContent className="p-0">
            
            {/* 1. SMART UPLOAD FORM */}
            <div className="p-6 md:p-8 bg-white border-b border-zinc-100">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <CloudUpload className="h-4 w-4 text-zinc-400" />
                    Upload New Document
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Input: Name */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Document Title</Label>
                        <Input 
                            value={docName} 
                            onChange={(e) => setDocName(e.target.value)} 
                            placeholder="e.g. Medical Board License"
                            className="h-11 bg-white border-zinc-200 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Input: Category */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Category</Label>
                        <Select value={docCategory} onValueChange={setDocCategory}>
                            <SelectTrigger className="h-11 bg-white border-zinc-200 focus:ring-indigo-500">
                                <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action: Upload Button */}
                    <div className="md:col-span-2 relative pt-2">
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
                                        height: "48px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        borderRadius: "12px",
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
                                            <CloudUpload className="h-4 w-4" /> 
                                            {docName ? `Upload "${docName}"` : "Upload Document"}
                                        </div>
                                    ) 
                                }}
                                disabled={!docName || !docCategory}
                            />
                        </div>
                        
                        {/* Tooltip */}
                        {(!docName || !docCategory) && !isUploading && (
                            <p className="absolute -top-6 left-0 w-full text-center text-[10px] text-orange-600 font-medium animate-in fade-in slide-in-from-bottom-1">
                                * Enter document details to enable upload
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. DOCUMENT LIST */}
            <div className="p-6 md:p-8 bg-zinc-50/30 min-h-[200px]">
                {documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc, idx) => (
                            <div key={idx} className="group flex items-center justify-between p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    {/* Icon Box */}
                                    <div className="h-12 w-12 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                        {getFileIcon(doc.fileType || doc.type)}
                                    </div>
                                    
                                    {/* Metadata */}
                                    <div className="min-w-0 flex flex-col">
                                        <span className="text-sm font-bold text-zinc-900 truncate" title={doc.title}>
                                            {doc.title}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                                {doc.category || "General"}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-medium">
                                                {(doc.fileType || doc.type || "FILE").toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Remove Action */}
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeDoc(idx)} 
                                    className="text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-colors h-9 w-9 rounded-lg shrink-0 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-zinc-100">
                            <FileText className="h-6 w-6 text-zinc-300" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900">No credentials yet</h3>
                        <p className="text-xs text-zinc-500 max-w-xs mt-1">
                            Your profile needs at least one verified document (Degree, License, etc.) to go live.
                        </p>
                    </div>
                )}
            </div>

        </CardContent>
      </Card>
    </div>
  );
}