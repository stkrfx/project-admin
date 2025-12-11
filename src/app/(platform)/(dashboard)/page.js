import { getDashboardContext } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, CheckCircle2, Circle, AlertTriangle, 
  XCircle, Clock, ShieldCheck, DollarSign, CalendarCheck, Users, Brain 
} from "lucide-react";
import Link from "next/link";

// Mock Data for Live Users (You can connect real data later)
const mockStats = [
  { name: "Total Revenue", value: "$0.00", icon: DollarSign, color: "text-emerald-500" },
  { name: "Appointments", value: "0", icon: CalendarCheck, color: "text-violet-500" },
  { name: "Active Clients", value: "0", icon: Users, color: "text-sky-500" },
];

export default async function DashboardPage() {
  const data = await getDashboardContext();
  
  if (!data) return <div className="p-8 text-center text-zinc-500">Loading dashboard...</div>;

  const { status, onboarding, rejectionReason, profile } = data;

  // ---------------------------------------------------------
  // STATE 1: REJECTED (Critical Fix Needed)
  // ---------------------------------------------------------
  if (status === "REJECTED") {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] max-w-lg mx-auto text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center shadow-sm">
                <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Action Required</h2>
                <p className="text-zinc-500 mt-3 text-lg leading-relaxed">
                    Our admin team reviewed your submission and found an issue. 
                    Please fix it to continue.
                </p>
            </div>
            
            {/* The Reason Box */}
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-left w-full shadow-sm">
                <h4 className="text-sm font-bold text-red-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Admin Feedback
                </h4>
                <p className="text-base text-red-800 font-medium leading-relaxed">
                    "{rejectionReason || "Please verify your credentials and re-upload clear documents."}"
                </p>
            </div>

            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white w-full rounded-xl text-base shadow-lg shadow-red-600/20">
                <Link href="/profile">Fix Profile & Resubmit</Link>
            </Button>
        </div>
      );
  }

  // ---------------------------------------------------------
  // STATE 2: PENDING (Waiting Game)
  // ---------------------------------------------------------
  if (status === "PENDING_INITIAL") {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
                <div className="h-24 w-24 bg-yellow-50 rounded-full flex items-center justify-center border border-yellow-100">
                    <Clock className="h-12 w-12 text-yellow-600" />
                </div>
                {/* Ping Animation */}
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
                </span>
            </div>
            
            <div className="max-w-md space-y-2">
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Verification in Progress</h2>
                <p className="text-zinc-500 text-lg">
                    We are currently verifying your credentials. This usually takes 24-48 hours.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button variant="outline" asChild size="lg" className="w-full rounded-xl">
                    <Link href="/profile">View Submission</Link>
                </Button>
            </div>
        </div>
      );
  }

  // ---------------------------------------------------------
  // STATE 3: ONBOARDING (New User)
  // ---------------------------------------------------------
  if (status === "ONBOARDING") {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-8">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome, Expert!</h2>
            <p className="text-zinc-500 text-lg">Complete these 3 steps to activate your account and start earning.</p>
        </div>

        <Card className="border-zinc-200 shadow-sm bg-zinc-900 text-white overflow-hidden relative rounded-2xl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <CardHeader className="relative z-10 pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>Setup Progress</span>
                    <span className="text-emerald-400 font-mono">{Math.round(onboarding.progress)}%</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-8">
                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                        style={{ width: `${onboarding.progress}%` }}
                    ></div>
                </div>

                {/* Steps Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StepItem 
                        label="Professional Bio" 
                        description="Tell clients about you"
                        done={onboarding.progress >= 33} 
                        link="/profile?tab=identity" 
                    />
                    <StepItem 
                        label="Add Services" 
                        description="Define your pricing"
                        done={onboarding.progress >= 66} 
                        link="/profile?tab=services" 
                    />
                    <StepItem 
                        label="Upload License" 
                        description="Verify your identity"
                        done={onboarding.progress >= 99} 
                        link="/profile?tab=documents" 
                    />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------
  // STATE 4: LIVE DASHBOARD (Business as Usual)
  // ---------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Overview</h2>
            <p className="text-zinc-500">Here&apos;s what&apos;s happening with your business.</p>
        </div>
        
        {/* Verification Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-sm font-medium w-fit">
            <ShieldCheck className="h-4 w-4" /> Verified Expert
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {mockStats.map((stat) => (
            <Card key={stat.name} className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">{stat.name}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>
      
      {/* Live Edit Notice */}
      {profile.hasPendingUpdates && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 text-blue-800 animate-in slide-in-from-top-2">
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                  <p className="font-semibold">Update Pending</p>
                  <p className="text-sm text-blue-700/80">
                      You have submitted profile changes. Your public profile will remain unchanged until these are approved by an admin.
                  </p>
              </div>
          </div>
      )}

      {/* Empty Appointments State */}
      <Card className="border-dashed border-2 shadow-none bg-zinc-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100">
                  <CalendarCheck className="h-6 w-6 text-zinc-300" />
              </div>
              <div>
                  <p className="text-zinc-900 font-medium">No upcoming appointments</p>
                  <p className="text-zinc-500 text-sm">Share your profile link to get booked.</p>
              </div>
              <Button variant="outline" asChild>
                  <Link href="/profile">Manage Availability</Link>
              </Button>
          </CardContent>
      </Card>
    </div>
  );
}

// Helper Component for Onboarding Steps
function StepItem({ label, description, done, link }) {
    return (
        <Link href={link} className="group flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all cursor-pointer">
            {done ? (
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <CheckCircle2 className="h-5 w-5"/>
                </div>
            ) : (
                <div className="h-8 w-8 rounded-full border-2 border-zinc-600 group-hover:border-zinc-500 shrink-0"></div>
            )}
            <div className="flex-1 min-w-0">
                <span className={done ? "text-zinc-400 line-through decoration-zinc-600 block font-medium" : "text-white font-medium block"}>
                    {label}
                </span>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate block">
                    {description}
                </span>
            </div>
            {!done && <ArrowRight className="h-4 w-4 text-zinc-500 ml-auto group-hover:translate-x-1 transition-transform"/>}
        </Link>
    )
}