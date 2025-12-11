import { getProfile } from "@/actions/profile";
import ProfileForm from "@/components/dashboard/profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, CheckCircle2, Eye, XCircle } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    // Graceful error instead of infinite loading
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <h2 className="text-xl font-semibold text-zinc-900">Profile Unavailable</h2>
            <p className="text-zinc-500">We couldn't load your profile. Please try refreshing.</p>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Expert Profile</h1>
          <p className="text-zinc-500">Manage your bio, services, and credentials.</p>
        </div>
        <div className="flex items-center gap-3">
            {profile.isVetted && (
                <Button variant="outline" asChild className="hidden sm:flex gap-2">
                    <Link href={`/experts/${profile._id}`} target="_blank">
                        <Eye className="h-4 w-4" /> Public View
                    </Link>
                </Button>
            )}
        </div>
      </div>

      {/* STATUS ALERTS */}
      {profile.rejectionReason && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-bold">Updates Rejected</AlertTitle>
          <AlertDescription>
            Admin Note: <strong>{profile.rejectionReason}</strong>. Please fix and resubmit.
          </AlertDescription>
        </Alert>
      )}

      {!profile.rejectionReason && profile.hasPendingUpdates && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="font-bold">Pending Approval</AlertTitle>
          <AlertDescription>
            Your latest changes are under review. Your public profile remains unchanged.
          </AlertDescription>
        </Alert>
      )}

      {/* FORM ENGINE */}
      <ProfileForm 
        // Pass the full profile object. The component handles the merging.
        initialData={profile} 
        isPending={profile.hasPendingUpdates}
      />
    </div>
  );
}