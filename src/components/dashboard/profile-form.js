"use client";

import { useState, useMemo, useEffect } from "react";
import { updateProfile } from "@/actions/profile";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { 
  Loader2, Save, Undo2, User, Briefcase, 
  Clock, ShieldCheck, Settings, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Sub-components
import { IdentitySection } from "./profile/identity-section";
import { ProfessionalSection } from "./profile/professional-section";
import { ServicesSection } from "./profile/services-section";
import { AvailabilitySection } from "./profile/availability-section";
import { DocumentsSection } from "./profile/documents-section";
import { SettingsSection } from "./profile/settings-section";

// Map validation fields to their respective tabs
const FIELD_TO_TAB = {
  name: "identity", username: "identity", gender: "identity", location: "identity", 
  linkedin: "identity", twitter: "identity", website: "identity",
  specialization: "professional", bio: "professional", workHistory: "professional", education: "professional", tags: "professional",
  services: "services",
  availability: "availability", leaves: "availability",
  documents: "documents",
  languages: "settings", timezone: "settings"
};

export default function ProfileForm({ initialData, isPending, initialTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 1. DETERMINE ACTIVE TAB
  // Priority: URL Param > Initial Prop > Default "identity"
  const currentTab = searchParams.get("tab") || initialTab || "identity";

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});

  // --- 2. DATA NORMALIZATION ---
  const expert = useMemo(() => {
    const normalize = (d, def) => (Array.isArray(d) ? d : typeof d === 'string' ? [{...def, title: d}] : []);
    const live = initialData || {};
    const draft = initialData.draft || {};
    
    return {
        ...live, ...draft,
        socialLinks: { linkedin:"", twitter:"", website:"", ...(live.socialLinks||{}), ...(draft.socialLinks||{}) },
        workHistory: normalize(draft.workHistory || live.workHistory, { company: "" }),
        education: normalize(draft.education || live.education, { institution: "" }),
        services: draft.services || live.services || [],
        tags: draft.tags || live.tags || [],
        languages: draft.languages || live.languages || [],
        documents: draft.documents || live.documents || [],
        availability: live.availability || [],
        leaves: live.leaves || [],
    };
  }, [initialData]);

  const user = initialData.user || {};

  // --- 3. STATE MANAGEMENT ---
  const [userName, setUserName] = useState(user.name || "");
  const [userUsername, setUserUsername] = useState(user.username || "");
  const [userImage, setUserImage] = useState(user.image || "");
  const [gender, setGender] = useState(expert.gender || "");
  const [location, setLocation] = useState(expert.location || "");
  const [socialLinks, setSocialLinks] = useState(expert.socialLinks);
  
  const [tags, setTags] = useState(expert.tags);
  const [workHistory, setWorkHistory] = useState(expert.workHistory);
  const [education, setEducation] = useState(expert.education);
  const [services, setServices] = useState(expert.services);
  const [documents, setDocuments] = useState(expert.documents);
  const [languages, setLanguages] = useState(expert.languages);
  const [availability, setAvailability] = useState(expert.availability);
  const [leaves, setLeaves] = useState(expert.leaves);

  // Dirty Check
  useEffect(() => setIsDirty(true), [userName, userUsername, userImage, gender, location, socialLinks, tags, workHistory, education, services, documents, languages, availability, leaves]);

  // --- 4. TAB URL SYNC ---
  const handleTabChange = (val) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", val);
    // Use replace to update URL without reloading page
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // --- 5. SUBMIT ---
  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData();
    // Identity
    formData.set("name", userName);
    formData.set("username", userUsername);
    formData.set("image", userImage);
    formData.set("gender", gender);
    formData.set("location", location);
    formData.set("linkedin", socialLinks.linkedin || "");
    formData.set("twitter", socialLinks.twitter || "");
    formData.set("website", socialLinks.website || "");
    
    // JSON Data
    formData.set("tags", JSON.stringify(tags));
    formData.set("workHistory", JSON.stringify(workHistory));
    formData.set("education", JSON.stringify(education));
    formData.set("services", JSON.stringify(services));
    formData.set("documents", JSON.stringify(documents));
    formData.set("availability", JSON.stringify(availability));
    formData.set("leaves", JSON.stringify(leaves));
    formData.set("languages", JSON.stringify(languages));
    
    // Explicitly grab uncontrolled inputs
    const bioInput = e.target.querySelector('[name="bio"]');
    if (bioInput) formData.set("bio", bioInput.value);
    const specInput = e.target.querySelector('[name="specialization"]');
    if (specInput) formData.set("specialization", specInput.value);

    const result = await updateProfile(null, formData);

    if (!result.success) {
        setErrors(result.errors || {});
        toast.error(result.message || "Please fix the highlighted errors.");
        
        // Auto-switch to the first tab with an error
        const firstErrorField = Object.keys(result.errors || {})[0];
        if (firstErrorField && FIELD_TO_TAB[firstErrorField]) {
            handleTabChange(FIELD_TO_TAB[firstErrorField]);
        }
    } else {
        toast.success(result.message);
        setIsDirty(false);
    }
    setIsLoading(false);
  };

  const hasError = (tab) => Object.keys(errors).some(field => FIELD_TO_TAB[field] === tab);

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
    if (socialLinks.linkedin) score += 5;
    return Math.min(score, 100);
  }, [userImage, userName, userUsername, expert, workHistory, education, services, availability, documents, location, socialLinks]);

  return (
    <form onSubmit={onSubmit}>
      {/* FORCE CONTROLLED TABS: value={currentTab} */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full pb-32">
        
        {/* Sticky Header */}
        <div className="sticky top-20 z-40 w-full max-w-5xl mx-auto rounded-full border border-zinc-200/80 bg-white/80 backdrop-blur-md shadow-sm mt-0 mb-8">
           <div className="px-2 h-14 flex items-center justify-between w-full">
              <TabsList className="bg-transparent h-auto flex flex-1 overflow-x-auto no-scrollbar mask-gradient-r px-2">
                  <ProfileTab value="identity" icon={User} label="Identity" hasError={hasError("identity")} />
                  <ProfileTab value="professional" icon={Briefcase} label="Career" hasError={hasError("professional")} />
                  <ProfileTab value="services" icon={Sparkles} label="Services" hasError={hasError("services")} />
                  <ProfileTab value="availability" icon={Clock} label="Schedule" hasError={hasError("availability")} />
                  <ProfileTab value="documents" icon={ShieldCheck} label="Verify" hasError={hasError("documents")} />
                  <ProfileTab value="settings" icon={Settings} label="Settings" hasError={hasError("settings")} />
              </TabsList>

              <div className="flex items-center gap-3 pr-2 border-l border-zinc-200 pl-3">
                  <div className="hidden md:flex items-center gap-2 mr-1" title="Profile Strength">
                      <div className="relative h-8 w-8">
                          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                              <path className="text-zinc-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                              <path className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-700">{Math.round(completionPercentage)}%</div>
                      </div>
                  </div>

                  {isDirty && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-9 w-9 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50">
                          <Undo2 className="h-4 w-4" />
                      </Button>
                  )}

                  <Button type="submit" disabled={isLoading} size="sm" className="h-9 px-5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm">
                      {isLoading ? <Loader2 className="animate-spin h-3.5 w-3.5"/> : <Save className="h-3.5 w-3.5 mr-2"/>}
                      {isPending ? "Update" : "Save"}
                  </Button>
              </div>
           </div>
        </div>

        {/* Tab Content */}
        <div className="w-full space-y-8 animate-in fade-in">
            <TabsContent value="identity"><IdentitySection user={{name:userName, username:userUsername, image:userImage}} expert={{gender, location}} socialLinks={socialLinks} setUserName={setUserName} setUserUsername={setUserUsername} setUserImage={setUserImage} setGender={setGender} setLocation={setLocation} setSocialLinks={setSocialLinks} /></TabsContent>
            <TabsContent value="professional"><ProfessionalSection expert={expert} tags={tags} setTags={setTags} workHistory={workHistory} setWorkHistory={setWorkHistory} education={education} setEducation={setEducation} /></TabsContent>
            <TabsContent value="services"><ServicesSection services={services} setServices={setServices} /></TabsContent>
            <TabsContent value="availability"><AvailabilitySection availability={availability} setAvailability={setAvailability} leaves={leaves} setLeaves={setLeaves} /></TabsContent>
            <TabsContent value="documents"><DocumentsSection documents={documents} setDocuments={setDocuments} /></TabsContent>
            <TabsContent value="settings"><SettingsSection expert={expert} languages={languages} setLanguages={setLanguages} /></TabsContent>
        </div>
      </Tabs>
    </form>
  );
}

function ProfileTab({ value, icon: Icon, label, hasError }) {
    return (
        <TabsTrigger value={value} className={cn(
            "relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all select-none",
            hasError ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50",
            "data-[state=active]:text-zinc-900 data-[state=active]:bg-zinc-100 data-[state=active]:font-semibold"
        )}>
            <Icon className={cn("h-4 w-4", hasError ? "text-red-500" : "opacity-70 group-data-[state=active]:opacity-100")} />
            <span className="hidden md:inline-block">{label}</span>
            {hasError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        </TabsTrigger>
    )
}