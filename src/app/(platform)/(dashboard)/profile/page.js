import { getProfile } from "@/actions/profile";
import ProfileForm from "@/components/dashboard/profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, CheckCircle2, Eye, XCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Edit Profile | Expert Dashboard",
  description: "Manage your professional identity, services, and availability.",
};

export default async function ProfilePage() {
  // 1. Fetch Profile (Triggers JIT "Next Day" Swap if applicable)
  const profile = await getProfile();

  // 2. Handle Edge Case: No Profile (Shouldn't happen for auth'd users, but good safety)
  if (!profile) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-zinc-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-zinc-900">Profile Unavailable</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    We couldn't load your profile data. Please try refreshing the page or contact support.
                </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Expert Profile</h1>
          <p className="text-zinc-500 max-w-2xl text-sm leading-relaxed">
            Manage your public presence, set your consulting hours, and verify your credentials. 
            Changes to "Availability" are live instantly (from tomorrow), while other details require admin approval.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
            {profile.isVetted && profile.isOnboarded ? (
                <Button variant="outline" asChild className="hidden sm:flex gap-2 h-10 border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                    <Link href={`/experts/${profile._id}`} target="_blank">
                        <Eye className="h-4 w-4" /> View Public Profile
                    </Link>
                </Button>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full border border-zinc-200">
                    <div className="h-2 w-2 bg-zinc-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-600">Private Draft</span>
                </div>
            )}
        </div>
      </div>

      {/* --- STATUS ALERTS --- */}
      
      {/* 1. Rejection Alert */}
      {profile.rejectionReason && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm">
          <XCircle className="h-5 w-5 text-red-600" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-red-950">Updates Rejected</AlertTitle>
            <AlertDescription className="text-red-800/90 mt-1 text-sm">
                The admin returned your profile with the following note: <br/>
                <span className="font-medium italic">"{profile.rejectionReason}"</span>
                <br/> Please fix the issues and save again to resubmit.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* 2. Pending Approval Alert */}
      {!profile.rejectionReason && profile.hasPendingUpdates && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm flex items-start gap-1">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <AlertTitle className="font-bold text-amber-950">In Review</AlertTitle>
            <AlertDescription className="text-amber-800/90 mt-1 text-sm leading-relaxed">
              Your latest changes (Bio, Documents, etc.) are waiting for admin approval. 
              Your <strong>Availability</strong> changes are already scheduled and don't need review.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* --- MAIN FORM ENGINE --- */}
      <ProfileForm 
        initialData={profile} 
        isPending={profile.hasPendingUpdates}
      />
    </div>
  );
}