import { getProfile } from "@/actions/profile";
import ProfileForm from "@/components/dashboard/profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER: Context & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Expert Profile</h1>
          <p className="text-zinc-500">Manage your bio, services, and availability.</p>
        </div>
        <div className="flex items-center gap-3">
            {profile.isVetted && (
                <Button variant="outline" asChild className="hidden sm:flex gap-2">
                    <Link href={`/experts/${profile._id}`} target="_blank">
                        <Eye className="h-4 w-4" /> View Public Page
                    </Link>
                </Button>
            )}
        </div>
      </div>

      {/* STATUS BANNERS: The "Truth" Source */}
      {/* 1. Rejected (Critical) */}
      {profile.rejectionReason && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-bold">Profile Rejected</AlertTitle>
          <AlertDescription>
            Reason: <strong>{profile.rejectionReason}</strong>. Please fix the issues below and resubmit.
          </AlertDescription>
        </Alert>
      )}

      {/* 2. Pending (Info) */}
      {!profile.rejectionReason && profile.hasPendingUpdates && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="font-bold">Verification in Progress</AlertTitle>
          <AlertDescription>
            You have unsaved changes pending admin review. Your public profile remains unchanged until approved.
          </AlertDescription>
        </Alert>
      )}

      {/* 3. Live (Success) */}
      {profile.isVetted && !profile.hasPendingUpdates && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="font-bold">You are Live!</AlertTitle>
          <AlertDescription>
            Your profile is active and visible to clients.
          </AlertDescription>
        </Alert>
      )}

      {/* THE FORM ENGINE */}
      <ProfileForm 
        initialData={profile.draft || profile} 
        isPending={profile.hasPendingUpdates}
      />
    </div>
  );
}