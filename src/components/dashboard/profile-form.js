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
  
  // --- 1. SMART DATA MERGING & NORMALIZATION ---
  const live = initialData || {};
  const draft = initialData.draft || {};
  
  const expert = useMemo(() => {
    // Helper to convert legacy string data to new Object format
    const normalizeEdu = (data) => {
        if (!data) return [];
        if (typeof data === 'string') return [{ institution: "", degree: data, fieldOfStudy: "", startDate: "", endDate: "", current: false }];
        if (Array.isArray(data)) {
            return data.map(item => (typeof item === 'string' ? { institution: "", degree: item, fieldOfStudy: "", startDate: "", endDate: "", current: false } : item));
        }
        return [];
    };

    const normalizeWork = (data) => {
        if (!data) return [];
        if (typeof data === 'string') return [{ company: "", role: data, startDate: "", endDate: "", current: false }];
        if (Array.isArray(data)) {
            return data.map(item => (typeof item === 'string' ? { company: "", role: item, startDate: "", endDate: "", current: false } : item));
        }
        return [];
    };

    return {
        ...live,
        ...draft,
        socialLinks: { ...live.socialLinks, ...draft.socialLinks },
        tags: draft.tags || live.tags || [],
        languages: draft.languages || live.languages || [],
        documents: draft.documents || live.documents || [],
        services: draft.services || live.services || [],
        availability: live.availability || [], 
        leaves: live.leaves || [],             
        
        // NORMALIZED ARRAYS (Prevents Crash)
        workHistory: normalizeWork(draft.workHistory || live.workHistory),
        education: normalizeEdu(draft.education || live.education),
    };
  }, [initialData]);

  const user = initialData.user || {};

  // --- 2. LOCAL STATE ---
  const [tags, setTags] = useState(expert.tags);
  const [languages, setLanguages] = useState(expert.languages);
  const [documents, setDocuments] = useState(expert.documents);
  const [services, setServices] = useState(expert.services);
  const [availability, setAvailability] = useState(expert.availability);
  const [leaves, setLeaves] = useState(expert.leaves);
  
  // Professional State
  const [workHistory, setWorkHistory] = useState(expert.workHistory);
  const [education, setEducation] = useState(expert.education);

  // Identity State
  const [userName, setUserName] = useState(user.name || "");
  const [userUsername, setUserUsername] = useState(user.username || "");
  const [userImage, setUserImage] = useState(user.image || "");
  const [gender, setGender] = useState(expert.gender || "");
  const [location, setLocation] = useState(expert.location || "");

  // Dirty Check
  useEffect(() => { setIsDirty(true); }, [tags, languages, documents, services, availability, leaves, userName, userUsername, userImage, gender, location, workHistory, education]);

  // --- 3. STRENGTH CALCULATOR ---
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (userImage) score += 10;
    if (userName) score += 10;
    if (expert.bio && expert.bio.length > 50) score += 15;
    if (expert.specialization) score += 5;
    if (workHistory.length > 0) score += 10;
    if (education.length > 0) score += 10;
    if (services.length > 0) score += 20;
    if (availability.length > 0) score += 10;
    if (documents.length > 0) score += 10;
    return Math.min(score, 100);
  }, [userImage, userName, expert, services, availability, documents, workHistory, education]);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);
    
    // Serialize Arrays
    formData.set("tags", JSON.stringify(tags));
    formData.set("languages", JSON.stringify(languages));
    formData.set("documents", JSON.stringify(documents));
    formData.set("services", JSON.stringify(services));
    formData.set("availability", JSON.stringify(availability));
    formData.set("leaves", JSON.stringify(leaves));
    formData.set("workHistory", JSON.stringify(workHistory)); 
    formData.set("education", JSON.stringify(education));     
    
    // Identity Fields
    formData.set("name", userName);
    formData.set("username", userUsername);
    formData.set("image", userImage);
    formData.set("gender", gender);
    formData.set("location", location);

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
      
      {/* --- STICKY BAR --- */}
      <div className="sticky top-20 z-40 w-full rounded-full border border-zinc-200 bg-white/90 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out mt-0 mb-8">
         <form onSubmit={onSubmit} onChange={handleInputChange} className="px-3 h-14 flex items-center justify-between w-full gap-4">
            <TabsList className="bg-transparent p-0 h-auto flex flex-1 min-w-0 items-center justify-start gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                <ProfileTab value="identity" icon={User} label="Identity" />
                <ProfileTab value="services" icon={Briefcase} label="Services" />
                <ProfileTab value="availability" icon={Clock} label="Schedule" />
                <ProfileTab value="documents" icon={ShieldCheck} label="Docs" />
                <ProfileTab value="settings" icon={Settings} label="Settings" />
            </TabsList>

            <div className="flex items-center gap-3 shrink-0 pl-3 border-l border-zinc-100">
                <div className="hidden md:flex items-center gap-2 mr-1 px-2 py-1 bg-zinc-50 rounded-full border border-zinc-100" title="Profile Strength">
                    <div className="relative h-4 w-4">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-zinc-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="5" />
                            <path className="text-emerald-500 transition-all duration-500 ease-out" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="5" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600">{Math.round(completionPercentage)}%</span>
                </div>

                {isDirty && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Undo2 className="h-4 w-4" />
                    </Button>
                )}

                <Button type="submit" disabled={isLoading || !isDirty} size="sm" className={`h-8 px-4 rounded-full transition-all text-xs font-bold tracking-wide flex items-center gap-2 ${isDirty ? "bg-zinc-900 text-white shadow-md hover:bg-zinc-800 hover:scale-105" : "bg-zinc-100 text-zinc-400 shadow-none cursor-not-allowed"}`}>
                    {isLoading ? <Loader2 className="animate-spin h-3 w-3"/> : <Save className="h-3 w-3"/>}
                    <span className="hidden sm:inline">{isPending ? "Update" : "Save"}</span>
                </Button>
            </div>
         </form>
      </div>

      {/* --- CONTENT --- */}
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <TabsContent value="identity" className="focus-visible:ring-0 space-y-8 mt-0">
              <IdentitySection 
                  user={{ name: userName, username: userUsername, image: userImage }} 
                  expert={{ gender, location }}
                  setUserName={setUserName}
                  setUserUsername={setUserUsername}
                  setUserImage={setUserImage}
                  setGender={setGender}
                  setLocation={setLocation}
              />
              <ProfessionalSection 
                  expert={expert} 
                  tags={tags} 
                  setTags={setTags} 
                  workHistory={workHistory} 
                  setWorkHistory={setWorkHistory}
                  education={education}
                  setEducation={setEducation}
              />
          </TabsContent>

          <TabsContent value="services" className="focus-visible:ring-0 mt-0">
              <ServicesSection services={services} setServices={setServices} />
          </TabsContent>

          <TabsContent value="availability" className="focus-visible:ring-0 mt-0">
              <AvailabilitySection availability={availability} setAvailability={setAvailability} leaves={leaves} setLeaves={setLeaves} />
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

function ProfileTab({ value, icon: Icon, label }) {
    return (
        <TabsTrigger value={value} className="group relative flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-500 transition-all outline-none select-none data-[state=active]:text-zinc-900 data-[state=active]:bg-zinc-100 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:text-zinc-800 hover:bg-zinc-50">
            <Icon className="h-5 w-5 md:h-3.5 md:w-3.5 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-indigo-600 transition-colors" />
            <span className="hidden md:inline-block">{label}</span>
        </TabsTrigger>
    )
}