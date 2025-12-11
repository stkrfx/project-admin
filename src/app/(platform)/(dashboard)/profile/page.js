import { getProfile } from "@/actions/profile";
import ProfileForm from "@/components/dashboard/profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Edit Profile | Expert Dashboard",
  description: "Manage your professional identity, services, and availability.",
};

export default async function ProfilePage({ searchParams }) {
  // 1. Fetch Profile
  const profile = await getProfile();

  // 2. Determine Active Tab (Default to 'identity')
  // We explicitly check searchParams to ensure server-side rendering matches the URL
  const validTabs = ["identity", "professional", "services", "availability", "documents", "settings"];
  const activeTab = validTabs.includes(searchParams?.tab) ? searchParams.tab : "identity";

  if (!profile) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Expert Profile</h1>
          <p className="text-zinc-500 mt-1">Manage your public presence and settings.</p>
        </div>
        
        {/* Public View Button (Only if verified) */}
        {profile.isVetted && (
            <Button variant="outline" asChild className="gap-2 border-zinc-200">
                <Link href={`/experts/${profile.user.username}`} target="_blank">
                    <Eye className="h-4 w-4"/> Public View
                </Link>
            </Button>
        )}
      </div>

      {/* REJECTION ALERT */}
      {profile.rejectionReason && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <XCircle className="h-5 w-5 text-red-600" />
          <div className="ml-2">
            <AlertTitle className="font-bold">Action Required</AlertTitle>
            <AlertDescription className="text-sm mt-1">
                {profile.rejectionReason}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* MAIN FORM */}
      <ProfileForm 
        initialData={profile} 
        isPending={profile.hasPendingUpdates}
        initialTab={activeTab} // Pass the server-resolved tab
      />
    </div>
  );
}