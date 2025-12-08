import Sidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-1">
      {/* Sidebar: Hidden on mobile, Fixed on Desktop */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 pt-16 z-30"> 
        {/* pt-16 ensures it sits BELOW the header (which is usually h-16) */}
        <Sidebar />
      </div>

      {/* Content Area: Pushed right by sidebar width */}
      <main className="flex-1 md:pl-64 p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  );
}