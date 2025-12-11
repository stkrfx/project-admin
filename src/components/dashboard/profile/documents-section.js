"use client";

import { useState } from "react"; // 1. Import useState
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/components/upload-button";
import { FileText, Trash2, ShieldCheck, Plus, Loader2 } from "lucide-react"; // 2. Import Loader2
import { toast } from "sonner";

export function DocumentsSection({ documents, setDocuments }) {
  const [isUploading, setIsUploading] = useState(false); // 3. Local State

  const removeDoc = (index) => setDocuments(documents.filter((_, i) => i !== index));

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-600"/> Credentials</CardTitle>
                <CardDescription>Upload your licenses and degrees for verification.</CardDescription>
            </div>
            <div className="hidden md:block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium border border-blue-100">
                Admin Verification Required
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* LIST */}
        {documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/50 hover:bg-zinc-50 transition-colors animate-in fade-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded bg-white border flex items-center justify-center shrink-0 shadow-sm">
                                <FileText className="h-5 w-5 text-zinc-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate text-zinc-900">{doc.title}</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wide">{doc.type}</p>
                            </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(idx)} className="h-8 w-8 text-zinc-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        )}

        {/* UPLOAD ZONE */}
        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 bg-zinc-50/30 hover:bg-zinc-50 transition-colors flex flex-col items-center text-center relative overflow-hidden">
            
            {/* 4. Loading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in">
                    <Loader2 className="h-8 w-8 text-zinc-900 animate-spin mb-2" />
                    <p className="text-sm font-medium text-zinc-700">Uploading document...</p>
                </div>
            )}

            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <Plus className="h-6 w-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-medium text-zinc-900">Upload New Document</h4>
            <p className="text-xs text-zinc-500 mb-6 max-w-xs">
                We accept PDF, JPG, or PNG files up to 8MB. Ensure text is legible.
            </p>
            
            <div className="w-auto min-w-[200px]">
                <UploadButton endpoint="expertDocument" 
                    onUploadBegin={() => setIsUploading(true)} // 5. Start Loading
                    onClientUploadComplete={(res) => {
                        if(res?.[0]) {
                            setDocuments([...documents, { 
                                title: res[0].name, 
                                url: res[0].url, 
                                type: res[0].name.endsWith(".pdf") ? "pdf" : "image" 
                            }]);
                            toast.success("Document attached");
                        }
                        setIsUploading(false); // 6. Stop Loading
                    }}
                    onUploadError={(error) => {
                        toast.error(`Upload failed: ${error.message}`);
                        setIsUploading(false);
                    }}
                    appearance={{
                        button: { background: "#18181b", color: "white", padding: "8px 16px" },
                        allowedContent: { display: "none" }
                    }}
                    content={{ button: "Select File" }}
                />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}