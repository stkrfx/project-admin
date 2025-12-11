import { getDashboardContext } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, CheckCircle2, Circle, AlertTriangle, 
  XCircle, Clock, ShieldCheck 
} from "lucide-react";
import Link from "next/link";

// Mock Data for Live Users
const mockStats = [
  { name: "Total Revenue", value: "$0.00" },
  { name: "Appointments", value: "0" },
  { name: "Active Clients", value: "0" },
];

export default async function DashboardPage() {
  const data = await getDashboardContext();
  
  if (!data) return <div>Loading...</div>;

  const { status, onboarding, rejectionReason } = data;

  // --- 1. REJECTED STATE (Highest Priority) ---
  if (status === "REJECTED") {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] max-w-lg mx-auto text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-zinc-900">Action Required</h2>
                <p className="text-zinc-500 mt-2">
                    Our admin team reviewed your profile and found an issue. 
                    Please update your details to continue.
                </p>
            </div>
            
            {/* The Reason Box */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-left w-full">
                <h4 className="text-sm font-semibold text-red-900 mb-1">Reason for rejection:</h4>
                <p className="text-sm text-red-700">{rejectionReason || "Credentials verification failed."}</p>
            </div>

            <Button asChild className="bg-red-600 hover:bg-red-700 text-white w-full">
                <Link href="/profile">Fix Profile & Resubmit</Link>
            </Button>
        </div>
      );
  }

  // --- 2. PENDING VERIFICATION STATE ---
  if (status === "PENDING_INITIAL") {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
            <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-zinc-900">Verification in Progress</h2>
                <p className="text-zinc-500 max-w-md mx-auto mt-2">
                    Thanks for submitting your profile! We are currently verifying your credentials. 
                    This usually takes 24-48 hours.
                </p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" asChild>
                    <Link href="/profile">View Submission</Link>
                </Button>
                <Button variant="ghost" disabled>
                    You will be notified via email
                </Button>
            </div>
        </div>
      );
  }

  // --- 3. ONBOARDING STATE (New User) ---
  if (status === "ONBOARDING") {
    return (
      <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome, Expert!</h2>
            <p className="text-zinc-500">Complete these steps to activate your account and start earning.</p>
        </div>

        <Card className="border-zinc-200 shadow-sm bg-zinc-900 text-white overflow-hidden relative">
            {/* Decorative Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full"></div>
            
            <CardHeader>
                <CardTitle className="flex justify-between items-center relative z-10">
                    <span>Setup Progress</span>
                    <span className="text-emerald-400">{Math.round(onboarding.progress)}%</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-8">
                    <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${onboarding.progress}%` }}
                    ></div>
                </div>

                {/* Steps */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StepItem 
                        label="Professional Bio" 
                        done={onboarding.progress >= 33} 
                        link="/profile?tab=identity" 
                    />
                    <StepItem 
                        label="Add Services" 
                        done={onboarding.progress >= 66} 
                        link="/profile?tab=services" 
                    />
                    <StepItem 
                        label="Upload License" 
                        done={onboarding.progress >= 99} 
                        link="/profile?tab=documents" 
                    />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  // --- 4. LIVE DASHBOARD (Vetted Expert) ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Overview</h2>
            <p className="text-zinc-500">Here&apos;s what&apos;s happening with your business.</p>
        </div>
        {/* Verification Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-sm font-medium">
            <ShieldCheck className="h-4 w-4" /> Verified Expert
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mockStats.map((stat) => (
            <Card key={stat.name} className="border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">{stat.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>
      
      {/* Pending Updates Notice (If Live but Edited) */}
      {data.profile.hasPendingUpdates && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-800">
              <Clock className="h-5 w-5" />
              <p className="text-sm">
                  You have pending profile changes waiting for admin approval. Your public profile is still visible as-is.
              </p>
          </div>
      )}
    </div>
  );
}

// Helper Component for Onboarding Steps
function StepItem({ label, done, link }) {
    return (
        <Link href={link} className="group flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all cursor-pointer">
            {done ? (
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="h-4 w-4"/>
                </div>
            ) : (
                <div className="h-6 w-6 rounded-full border-2 border-zinc-600 group-hover:border-zinc-500"></div>
            )}
            <span className={done ? "text-zinc-400 line-through decoration-zinc-600" : "text-white font-medium"}>
                {label}
            </span>
            {!done && <ArrowRight className="h-4 w-4 text-zinc-500 ml-auto group-hover:translate-x-1 transition-transform"/>}
        </Link>
    )
}