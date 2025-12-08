import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-dvh w-full bg-zinc-50/50">
      {/* Sidebar (Hidden on mobile, usually handled by a sheet/drawer in production) */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        <Header />
        <main className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}