"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  CheckCircle2, XCircle, AlertCircle, Loader2, 
  ChevronRight, User, FileText, Calendar, ShieldCheck 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminVerifyPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // State for the Review Dialog
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject'
  const [adminNote, setAdminNote] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);

  // --- 1. FETCH DATA ---
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/verify");
      const data = await res.json();
      if (data.profiles) setProfiles(data.profiles);
    } catch (error) {
      toast.error("Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // --- 2. HELPERS ---
  const openReview = (profile) => {
    setSelectedProfile(profile);
    // Auto-select all available draft fields by default
    const draftKeys = Object.keys(profile.draft || {}).filter(k => profile.draft[k] !== undefined);
    setSelectedFields(draftKeys);
    setReviewAction("approve"); // Default mode
    setAdminNote("");
  };

  const submitReview = async () => {
    if (!selectedProfile || !reviewAction) return;
    
    if (reviewAction === "reject" && !adminNote.trim()) {
        toast.error("Please provide a rejection reason.");
        return;
    }

    try {
        setActionLoading(true);
        const payload = {
            expertId: selectedProfile._id,
            action: reviewAction,
            reason: adminNote,
            // Only send fields if approving
            approvedFields: reviewAction === "approve" ? selectedFields : undefined
        };

        const res = await fetch("/api/admin/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.error);

        toast.success(result.message);
        setSelectedProfile(null); // Close dialog
        fetchQueue(); // Refresh list

    } catch (error) {
        toast.error(error.message);
    } finally {
        setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900">Verification Queue</h1>
            <p className="text-zinc-500">Review pending profile updates from experts.</p>
        </div>
        <Button variant="outline" onClick={fetchQueue} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* QUEUE LIST */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-xl">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-zinc-900">All Caught Up!</h3>
            <p className="text-zinc-500">No pending verifications found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {profiles.map((profile) => (
                <Card key={profile._id} className="hover:border-zinc-300 transition-all">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                        
                        {/* User Info */}
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={profile.user?.image} />
                                <AvatarFallback>{profile.user?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="font-bold text-zinc-900">{profile.user?.name}</h4>
                                <p className="text-sm text-zinc-500">@{profile.user?.username}</p>
                            </div>
                        </div>

                        {/* Changes Summary */}
                        <div className="flex-1 flex flex-wrap gap-2">
                            {Object.keys(profile.draft || {}).map((key) => (
                                <Badge key={key} variant="secondary" className="capitalize text-zinc-600">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </Badge>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400">
                                Requested {new Date(profile.createdAt).toLocaleDateString()}
                            </span>
                            <Button onClick={() => openReview(profile)}>
                                Review Updates <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            ))}
        </div>
      )}

      {/* REVIEW DIALOG */}
      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Review Updates</DialogTitle>
                <DialogDescription>
                    Select fields to approve. Unchecked fields will retain their old values.
                </DialogDescription>
            </DialogHeader>

            {selectedProfile && (
                <div className="space-y-6 py-4">
                    
                    {/* User Context */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                        <User className="h-5 w-5 text-zinc-400" />
                        <span className="text-sm font-medium">
                            Applicant: <strong>{selectedProfile.user?.name}</strong> ({selectedProfile.user?.email})
                        </span>
                    </div>

                    {/* Field Selector */}
                    <ScrollArea className="h-[200px] border rounded-lg p-4">
                        <div className="space-y-3">
                            {Object.keys(selectedProfile.draft || {}).map((field) => (
                                <div key={field} className="flex items-start space-x-3 p-2 hover:bg-zinc-50 rounded-md transition-colors">
                                    <Checkbox 
                                        id={field} 
                                        checked={selectedFields.includes(field)}
                                        onCheckedChange={(checked) => {
                                            if(checked) setSelectedFields([...selectedFields, field]);
                                            else setSelectedFields(selectedFields.filter(f => f !== field));
                                        }}
                                        disabled={reviewAction === "reject"}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor={field}
                                            className="text-sm font-semibold capitalize cursor-pointer"
                                        >
                                            {field.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        <p className="text-xs text-zinc-500 truncate max-w-md">
                                            {JSON.stringify(selectedProfile.draft[field]).substring(0, 60)}...
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Action Mode Switcher */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setReviewAction("approve")}
                            className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                                reviewAction === "approve" 
                                ? "bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200" 
                                : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                            }`}
                        >
                            <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                            Approve Selected
                        </button>
                        <button
                            onClick={() => setReviewAction("reject")}
                            className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                                reviewAction === "reject" 
                                ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200" 
                                : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                            }`}
                        >
                            <XCircle className="h-5 w-5 mx-auto mb-1" />
                            Reject All
                        </button>
                    </div>

                    {/* Admin Note */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-zinc-500">
                            {reviewAction === "reject" ? "Reason for Rejection (Required)" : "Feedback Note (Optional)"}
                        </label>
                        <Textarea 
                            value={adminNote} 
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder={reviewAction === "reject" ? "e.g. ID document blurry, please retry." : "e.g. Verified. Good luck!"}
                            className="resize-none"
                        />
                    </div>

                </div>
            )}

            <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedProfile(null)}>Cancel</Button>
                <Button 
                    onClick={submitReview} 
                    disabled={actionLoading}
                    variant={reviewAction === "reject" ? "destructive" : "default"}
                >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {reviewAction === "reject" ? "Confirm Rejection" : "Confirm Approval"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}