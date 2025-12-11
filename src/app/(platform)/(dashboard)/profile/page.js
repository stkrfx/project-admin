import { getProfile } from "@/actions/profile";
import ProfileForm from "@/components/dashboard/profile-form";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    return <div>Loading...</div>; // Or redirect to setup
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* 1. Header & Context */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Expert Profile</h1>
        <p className="text-zinc-500">
          Manage your public appearance and expertise details.
        </p>
      </div>

      {/* 2. STATUS BANNERS (The Critical "Verification" Logic) */}
      
      {/* SCENARIO A: Pending Review */}
      {profile.hasPendingUpdates && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-top-2">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Changes Pending Approval</h4>
            <p className="text-sm text-yellow-700 mt-1">
              You have made changes that are waiting for admin verification. 
              Your <strong>Live Profile</strong> will continue to show your old details until these are approved.
            </p>
          </div>
        </div>
      )}

      {/* SCENARIO B: Fully Verified & Live */}
      {!profile.hasPendingUpdates && profile.isVetted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-900">Profile is Live</h4>
            <p className="text-sm text-emerald-700 mt-1">
              Your profile is verified and visible to clients. Any new edits will require re-verification.
            </p>
          </div>
        </div>
      )}

      {/* SCENARIO C: Not Onboarded (New Account) */}
      {!profile.isVetted && !profile.hasPendingUpdates && (
        <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-4 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-zinc-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-zinc-900">Profile Unpublished</h4>
            <p className="text-sm text-zinc-600 mt-1">
              Please complete your details and submit for verification to go live.
            </p>
          </div>
        </div>
      )}

      {/* 3. The Form (Passed with Draft data if available) */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <ProfileForm 
          // If draft exists, show draft. Otherwise show live.
          initialData={profile.draft || profile} 
          isPending={profile.hasPendingUpdates}
        />
      </div>
    </div>
  );
}