"use client";

import { useState, useEffect, useMemo } from "react";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { 
  Loader2, Save, Undo2, User, Briefcase, 
  Clock, ShieldCheck, Settings, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// --- SUB-COMPONENTS ---
import { IdentitySection } from "./profile/identity-section";
import { ProfessionalSection } from "./profile/professional-section";
import { ServicesSection } from "./profile/services-section";
import { AvailabilitySection } from "./profile/availability-section";
import { DocumentsSection } from "./profile/documents-section";
import { SettingsSection } from "./profile/settings-section";

export default function ProfileForm({ initialData, isPending }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // --- 1. DATA NORMALIZATION ---
  const expert = useMemo(() => {
    const normalizeArray = (data, defaultObj) => {
        if (!data) return [];
        if (typeof data === 'string') return [{ ...defaultObj, title: data, name: data, role: data, degree: data }]; 
        if (Array.isArray(data)) {
            return data.map(item => (typeof item === 'string' ? { ...defaultObj, title: item, name: item, role: item, degree: item } : item));
        }
        return data;
    };

    const live = initialData || {};
    const draft = initialData.draft || {};

    return {
        ...live,
        ...draft,
        // FIX: Ensure socialLinks structure exists
        socialLinks: { 
            linkedin: "", twitter: "", website: "", 
            ...(live.socialLinks || {}), 
            ...(draft.socialLinks || {}) 
        },
        tags: draft.tags || live.tags || [],
        languages: draft.languages || live.languages || [],
        workHistory: normalizeArray(draft.workHistory || live.workHistory, { company: "", role: "", startDate: "", current: false }),
        education: normalizeArray(draft.education || live.education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", current: false }),
        availability: live.availability || [],
        leaves: live.leaves || [],
        documents: draft.documents || live.documents || [],
        services: draft.services || live.services || [],
    };
  }, [initialData]);

  const user = initialData.user || {};

  // --- 2. GLOBAL STATE ---
  // Identity
  const [userName, setUserName] = useState(user.name || "");
  const [userUsername, setUserUsername] = useState(user.username || "");
  const [userImage, setUserImage] = useState(user.image || "");
  const [gender, setGender] = useState(expert.gender || "");
  const [location, setLocation] = useState(expert.location || "");
  
  // FIX: Restore Social Links State
  const [socialLinks, setSocialLinks] = useState(expert.socialLinks);

  // Professional
  const [tags, setTags] = useState(expert.tags);
  const [workHistory, setWorkHistory] = useState(expert.workHistory);
  const [education, setEducation] = useState(expert.education);
  
  // Others
  const [services, setServices] = useState(expert.services);
  const [documents, setDocuments] = useState(expert.documents);
  const [languages, setLanguages] = useState(expert.languages);
  const [availability, setAvailability] = useState(expert.availability);
  const [leaves, setLeaves] = useState(expert.leaves);

  // Dirty Checking
  useEffect(() => { 
      setIsDirty(true); 
  }, [userName, userUsername, userImage, gender, location, socialLinks, tags, workHistory, education, services, documents, languages, availability, leaves]);

  // --- 3. SUBMISSION ---
  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.target);
    
    // Inject Arrays/Objects
    formData.set("tags", JSON.stringify(tags));
    formData.set("languages", JSON.stringify(languages));
    formData.set("workHistory", JSON.stringify(workHistory));
    formData.set("education", JSON.stringify(education));
    formData.set("services", JSON.stringify(services));
    formData.set("documents", JSON.stringify(documents));
    formData.set("availability", JSON.stringify(availability));
    formData.set("leaves", JSON.stringify(leaves));
    
    // Inject Identity
    formData.set("name", userName);
    formData.set("username", userUsername);
    formData.set("image", userImage);
    formData.set("gender", gender);
    formData.set("location", location);

    // FIX: Inject Social Links Manually (to handle empty strings correctly)
    formData.set("linkedin", socialLinks.linkedin || "");
    formData.set("twitter", socialLinks.twitter || "");
    formData.set("website", socialLinks.website || "");

    const result = await updateProfile(formData);
    
    if (result.error) {
        toast.error(result.error);
    } else {
        toast.success("Changes saved successfully!", { 
            description: isPending ? "Profile is under review." : "Your profile is updated." 
        });
        setIsDirty(false);
    }
    setIsLoading(false);
  }

  // Strength Meter
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (userImage) score += 10;
    if (userName && userUsername) score += 10;
    if (expert.bio?.length > 50) score += 10;
    if (workHistory.length > 0) score += 10;
    if (education.length > 0) score += 5;
    if (services.length > 0) score += 20;
    if (availability.length > 0) score += 10;
    if (documents.length > 0) score += 10;
    if (location) score += 10;
    if (socialLinks.linkedin || socialLinks.website) score += 5;
    return Math.min(score, 100);
  }, [userImage, userName, userUsername, expert, workHistory, education, services, availability, documents, location, socialLinks]);

  return (
    <form onSubmit={onSubmit} onChange={() => setIsDirty(true)}>
      <Tabs defaultValue="identity" className="w-full pb-32">
        
        {/* FLOATING HEADER */}
        <div className="sticky top-20 z-40 w-full max-w-5xl mx-auto rounded-full border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out mt-0 mb-8 supports-[backdrop-filter]:bg-white/60">
           <div className="px-2 h-14 flex items-center justify-between w-full gap-2 md:gap-4">
              <TabsList className="bg-transparent p-0 h-auto flex flex-1 min-w-0 items-center justify-start gap-1 overflow-x-auto no-scrollbar mask-gradient-r px-2">
                  <ProfileTab value="identity" icon={User} label="Identity" />
                  <ProfileTab value="professional" icon={Briefcase} label="Career" />
                  <ProfileTab value="services" icon={Sparkles} label="Services" />
                  <ProfileTab value="availability" icon={Clock} label="Schedule" />
                  <ProfileTab value="documents" icon={ShieldCheck} label="Verify" />
                  <ProfileTab value="settings" icon={Settings} label="Settings" />
              </TabsList>

              <div className="flex items-center gap-3 shrink-0 pl-3 border-l border-zinc-200 pr-2">
                  <div className="hidden md:flex items-center gap-2 mr-1" title={`Profile Strength: ${Math.round(completionPercentage)}%`}>
                      <div className="relative h-8 w-8">
                          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                              <path className="text-zinc-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                              <path className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-700">
                              {Math.round(completionPercentage)}%
                          </div>
                      </div>
                  </div>

                  {isDirty && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-9 w-9 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Undo2 className="h-4 w-4" />
                      </Button>
                  )}

                  <Button type="submit" disabled={isLoading || !isDirty} size="sm" className={cn("h-9 px-5 rounded-full transition-all text-xs font-bold tracking-wide flex items-center gap-2 shadow-sm", isDirty ? "bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md hover:scale-[1.02]" : "bg-zinc-100 text-zinc-400 shadow-none cursor-not-allowed")}>
                      {isLoading ? <Loader2 className="animate-spin h-3.5 w-3.5"/> : <Save className="h-3.5 w-3.5"/>}
                      <span className="hidden sm:inline">{isPending ? "Update" : "Save"}</span>
                  </Button>
              </div>
           </div>
        </div>

        {/* CONTENT */}
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabsContent value="identity" className="focus-visible:ring-0 mt-0">
                <IdentitySection 
                    user={{ name: userName, username: userUsername, image: userImage }} 
                    expert={{ gender, location }}
                    socialLinks={socialLinks} // Pass it down
                    setUserName={setUserName}
                    setUserUsername={setUserUsername}
                    setUserImage={setUserImage}
                    setGender={setGender}
                    setLocation={setLocation}
                    setSocialLinks={setSocialLinks} // Pass setter
                />
            </TabsContent>
            
            <TabsContent value="professional" className="focus-visible:ring-0 mt-0">
                <ProfessionalSection expert={expert} tags={tags} setTags={setTags} workHistory={workHistory} setWorkHistory={setWorkHistory} education={education} setEducation={setEducation} />
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
    </form>
  );
}

function ProfileTab({ value, icon: Icon, label }) {
    return (
        <TabsTrigger value={value} className="group relative flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-zinc-500 transition-all outline-none select-none data-[state=active]:text-zinc-900 data-[state=active]:bg-zinc-100 data-[state=active]:font-semibold hover:text-zinc-800 hover:bg-zinc-50">
            <Icon className="h-4 w-4 md:h-3.5 md:w-3.5 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-indigo-600 transition-colors" />
            <span className="hidden md:inline-block">{label}</span>
        </TabsTrigger>
    )
}