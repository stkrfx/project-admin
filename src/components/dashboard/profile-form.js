"use client";

import { useState, useEffect, useMemo } from "react";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { 
  Loader2, Save, Undo2, User, Briefcase, 
  Clock, ShieldCheck, Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sub-components
import { IdentitySection } from "./profile/identity-section";
import { ProfessionalSection } from "./profile/professional-section";
import { ServicesSection } from "./profile/services-section";
import { AvailabilitySection } from "./profile/availability-section";
import { DocumentsSection } from "./profile/documents-section";
import { SettingsSection } from "./profile/settings-section";

export default function ProfileForm({ initialData, isPending }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // --- 1. SMART DATA MERGING ---
  const live = initialData || {};
  const draft = initialData.draft || {};
  
  const expert = useMemo(() => ({
    ...live,
    ...draft,
    socialLinks: { ...live.socialLinks, ...draft.socialLinks },
    tags: draft.tags || live.tags || [],
    languages: draft.languages || live.languages || [],
    documents: draft.documents || live.documents || [],
    services: draft.services || live.services || [],
    availability: draft.availability || live.availability || [],
    leaves: draft.leaves || live.leaves || [],
  }), [initialData]);

  const user = initialData.user || {};

  // --- 2. LOCAL STATE ---
  const [tags, setTags] = useState(expert.tags);
  const [languages, setLanguages] = useState(expert.languages);
  const [documents, setDocuments] = useState(expert.documents);
  const [services, setServices] = useState(expert.services);
  const [availability, setAvailability] = useState(expert.availability);
  const [leaves, setLeaves] = useState(expert.leaves);
  
  const [userName, setUserName] = useState(user.name || "");
  const [userUsername, setUserUsername] = useState(user.username || "");
  const [userImage, setUserImage] = useState(user.image || "");

  useEffect(() => { setIsDirty(true); }, [tags, languages, documents, services, availability, leaves, userName, userUsername, userImage]);

  // --- 3. STRENGTH CALCULATOR ---
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (userImage) score += 10;
    if (userName) score += 10;
    if (expert.bio && expert.bio.length > 50) score += 20;
    if (expert.specialization) score += 10;
    if (services.length > 0) score += 20;
    if (availability.length > 0) score += 10;
    if (documents.length > 0) score += 10;
    if (expert.location) score += 10;
    return Math.min(score, 100);
  }, [userImage, userName, expert, services, availability, documents]);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);
    
    formData.set("tags", JSON.stringify(tags));
    formData.set("languages", JSON.stringify(languages));
    formData.set("documents", JSON.stringify(documents));
    formData.set("services", JSON.stringify(services));
    formData.set("availability", JSON.stringify(availability));
    formData.set("leaves", JSON.stringify(leaves));
    
    formData.set("name", userName);
    formData.set("username", userUsername);
    formData.set("image", userImage);

    const result = await updateProfile(formData);
    
    if (result.error) {
        toast.error(result.error);
    } else {
        toast.success("Profile saved!", { description: isPending ? "Sent for verification." : "Changes are live." });
        setIsDirty(false);
    }
    setIsLoading(false);
  }

  const handleInputChange = () => setIsDirty(true);

  return (
    <Tabs defaultValue="identity" className="w-full pb-20">
      
      {/* --- FLOATING STICKY BAR --- */}
      <div className="sticky top-20 z-40 w-full rounded-full border border-zinc-200 bg-white/90 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out mt-0 mb-8">
         <form onSubmit={onSubmit} onChange={handleInputChange} className="px-3 h-14 flex items-center justify-between w-full gap-4">
            
            {/* LEFT: TABS (SCROLLABLE & RESPONSIVE) */}
            {/* Added 'flex-1 min-w-0' to force scrolling instead of pushing content off-screen */}
            <TabsList className="bg-transparent p-0 h-auto flex flex-1 min-w-0 items-center justify-start gap-1 no-scrollbar scroll-smooth">
                <ProfileTab value="identity" icon={User} label="Identity" />
                <ProfileTab value="services" icon={Briefcase} label="Services" />
                <ProfileTab value="availability" icon={Clock} label="Schedule" />
                <ProfileTab value="documents" icon={ShieldCheck} label="Docs" />
                <ProfileTab value="settings" icon={Settings} label="Settings" />
            </TabsList>

            {/* RIGHT: COMPACT ACTIONS */}
            <div className="flex items-center gap-3 shrink-0 pl-3 border-l border-zinc-100">
                
                {/* Strength Indicator */}
                <div className="hidden md:flex items-center gap-2 mr-1 px-2 py-1 bg-zinc-50 rounded-full border border-zinc-100" title="Profile Strength">
                    <div className="relative h-4 w-4">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-zinc-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="5" />
                            <path className="text-emerald-500 transition-all duration-500 ease-out" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="5" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600">{Math.round(completionPercentage)}%</span>
                </div>

                {/* Discard */}
                {isDirty && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => window.location.reload()} 
                        className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Discard Changes"
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                )}

                {/* Save Pill */}
                <Button 
                    type="submit" 
                    disabled={isLoading || !isDirty} 
                    size="sm"
                    className={`h-8 px-4 rounded-full transition-all text-xs font-bold tracking-wide flex items-center gap-2
                    ${isDirty 
                        ? "bg-zinc-900 text-white shadow-md hover:bg-zinc-800 hover:scale-105" 
                        : "bg-zinc-100 text-zinc-400 shadow-none cursor-not-allowed"
                    }`}
                >
                    {isLoading ? <Loader2 className="animate-spin h-3 w-3"/> : <Save className="h-3 w-3"/>}
                    <span className="hidden sm:inline">{isPending ? "Update" : "Save"}</span>
                </Button>
            </div>
         </form>
      </div>

      {/* --- CONTENT SECTIONS --- */}
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <TabsContent value="identity" className="focus-visible:ring-0 space-y-8 mt-0">
              <IdentitySection 
                  user={{ name: userName, username: userUsername, image: userImage }} 
                  setUserName={setUserName}
                  setUserUsername={setUserUsername}
                  setUserImage={setUserImage}
              />
              <ProfessionalSection expert={expert} tags={tags} setTags={setTags} />
          </TabsContent>

          <TabsContent value="services" className="focus-visible:ring-0 mt-0">
              <ServicesSection services={services} setServices={setServices} />
          </TabsContent>

          <TabsContent value="availability" className="focus-visible:ring-0 mt-0">
              <AvailabilitySection 
                  availability={availability} 
                  setAvailability={setAvailability}
                  leaves={leaves}
                  setLeaves={setLeaves}
              />
          </TabsContent>

          <TabsContent value="documents" className="focus-visible:ring-0 mt-0">
              <DocumentsSection documents={documents} setDocuments={setDocuments} />
          </TabsContent>

          <TabsContent value="settings" className="focus-visible:ring-0 mt-0">
              <SettingsSection expert={expert} languages={languages} setLanguages={setLanguages} />
          </TabsContent>
      </div>

    </Tabs>
  );
}

// --- RESPONSIVE TAB COMPONENT ---
function ProfileTab({ value, icon: Icon, label }) {
    return (
        <TabsTrigger 
            value={value} 
            className="group relative flex items-center justify-center gap-2 rounded-full transition-all outline-none select-none shrink-0
            
            /* Mobile Styles: Taller touch target, Icon only */
            h-10 w-10 p-0 text-zinc-400
            
            /* Desktop Styles: Compact height, Text visible */
            md:h-8 md:w-auto md:px-3 md:py-0 md:text-xs md:font-semibold md:text-zinc-500

            /* Active States */
            data-[state=active]:text-zinc-900 data-[state=active]:bg-zinc-100 data-[state=active]:shadow-sm
            hover:text-zinc-800 hover:bg-zinc-50"
            title={label}
        >
            <Icon className="h-5 w-5 md:h-3.5 md:w-3.5 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-indigo-600 transition-colors" />
            <span className="hidden md:inline-block">{label}</span>
        </TabsTrigger>
    )
}