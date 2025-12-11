"use client";

import { useState, useRef, useEffect } from "react";
import { updateProfile } from "@/actions/profile";
import { UploadButton } from "@/components/upload-button";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";
import { 
  Loader2, Save, User, Briefcase, MapPin, 
  Globe, GraduationCap, Clock, Link as LinkIcon, 
  FileText, Trash2, Plus, DollarSign, Calendar, 
  ShieldAlert, Camera, RefreshCw, Undo2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Australian Timezones
const TIMEZONES = [
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane",
  "Australia/Adelaide", "Australia/Perth", "Australia/Darwin", "Australia/Hobart",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ProfileForm({ initialData, isPending }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDocUploading, setIsDocUploading] = useState(false); // Doc specific loader

  // --- 1. SMART MERGE: LIVE + DRAFT ---
  // This ensures that if you only edited 'bio', your 'location' doesn't disappear.
  const live = initialData || {};
  const draft = initialData.draft || {};
  const expert = { ...live, ...draft, socialLinks: { ...live.socialLinks, ...draft.socialLinks } };
  const user = initialData.user || {};

  // Local State
  const [tags, setTags] = useState(expert?.tags || []);
  const [languages, setLanguages] = useState(expert?.languages || []);
  const [documents, setDocuments] = useState(expert?.documents || []);
  const [services, setServices] = useState(expert?.services || []);
  const [availability, setAvailability] = useState(expert?.availability || []);
  
  // Identity State (Direct User Updates)
  const [userName, setUserName] = useState(user.name || "");
  const [userUsername, setUserUsername] = useState(user.username || "");
  const [userImage, setUserImage] = useState(user.image || "");

  // Mark dirty on change
  useEffect(() => { setIsDirty(true); }, [tags, languages, documents, services, availability, userName, userUsername, userImage]);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);
    
    // Inject complex state
    formData.set("tags", JSON.stringify(tags));
    formData.set("languages", JSON.stringify(languages));
    formData.set("documents", JSON.stringify(documents));
    formData.set("services", JSON.stringify(services));
    formData.set("availability", JSON.stringify(availability));
    
    // Inject Identity State
    formData.set("name", userName);
    formData.set("username", userUsername);
    formData.set("image", userImage);

    const result = await updateProfile(formData);
    
    if (result.error) {
        toast.error(result.error);
    } else {
        toast.success("Profile updated successfully!");
        setIsDirty(false);
    }
    
    setIsLoading(false);
  }

  // --- Identity Logic ---
  const generateUsername = () => {
    if (!userName) return;
    const random = Math.floor(Math.random() * 1000);
    const generated = userName.toLowerCase().replace(/\s+/g, '') + random;
    setUserUsername(generated);
    toast.success(`Generated username: ${generated}`);
  };

  // --- Services Logic ---
  const addService = () => setServices([...services, { name: "", type: "video", price: 0, duration: 60, description: "" }]);
  const updateService = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };
  const removeService = (index) => setServices(services.filter((_, i) => i !== index));

  // --- Availability Logic ---
  const addSlot = () => setAvailability([...availability, { dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" }]);
  const updateSlot = (index, field, value) => {
    const newSlots = [...availability];
    newSlots[index][field] = value;
    setAvailability(newSlots);
  };
  const removeSlot = (index) => setAvailability(availability.filter((_, i) => i !== index));

  // --- Document Logic ---
  const removeDoc = (index) => setDocuments(documents.filter((_, i) => i !== index));

  const formatArray = (arr) => Array.isArray(arr) ? arr.join(", ") : arr || "";

  return (
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto pb-20 space-y-8">
      
      {/* STICKY HEADER */}
      <div className="sticky top-[70px] z-40 bg-white/80 backdrop-blur-xl border border-zinc-200 p-4 rounded-xl shadow-sm flex items-center justify-between transition-all">
         <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 flex items-center gap-2">
                Profile Editor
                {isPending && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">Pending Review</span>}
            </span>
            <span className="text-xs text-zinc-500">
                {isDirty ? "Unsaved changes" : "All changes saved locally"}
            </span>
         </div>
         <div className="flex gap-2">
            {isDirty && (
                <Button type="button" variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-zinc-500 hover:text-zinc-900 hidden sm:flex">
                    <Undo2 className="mr-2 h-4 w-4" /> Discard
                </Button>
            )}
            <Button type="submit" disabled={isLoading || !isDirty} className={`transition-all shadow-md ${isDirty ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-400 shadow-none"}`}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>}
                {isPending ? "Update Submission" : "Save Changes"}
            </Button>
         </div>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="w-full justify-start border-b border-zinc-200 bg-transparent p-0 mb-8 h-auto space-x-6 overflow-x-auto">
          {["identity", "services", "availability", "documents", "settings"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 rounded-none px-2 py-3 bg-transparent text-sm font-medium text-zinc-500 data-[state=active]:text-zinc-900 transition-colors">
                {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 1. IDENTITY TAB */}
        <TabsContent value="identity" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Picture */}
              <Card className="lg:col-span-1 border-zinc-200 shadow-sm h-fit">
                <CardHeader><CardTitle className="text-base">Profile Photo</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="relative group h-32 w-32 rounded-full overflow-hidden border-4 border-zinc-50 shadow-lg cursor-pointer">
                        <Avatar className="h-full w-full">
                            <AvatarImage src={userImage} className="object-cover"/>
                            <AvatarFallback className="text-4xl bg-zinc-100 text-zinc-300 font-bold">{userName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="h-8 w-8" />
                        </div>
                        {/* Hidden Upload Button Trigger */}
                        <div className="absolute inset-0 opacity-0 cursor-pointer">
                             <UploadButton endpoint="profilePicture" 
                                onClientUploadComplete={(res) => { if(res?.[0]) setUserImage(res[0].url); toast.success("Photo updated!"); }}
                                content={{ button: " " }}
                                appearance={{ button: { width: "100%", height: "100%" } }}
                             />
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 text-center">Click image to upload.</p>
                </CardContent>
              </Card>

              {/* Personal Details */}
              <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-zinc-500"/> Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g. Dr. Sarah Connor" />
                        </div>
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <div className="flex gap-2">
                                <Input value={userUsername} onChange={(e) => setUserUsername(e.target.value)} placeholder="sarahconnor" />
                                <Button type="button" variant="outline" size="icon" onClick={generateUsername} title="Generate Username">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Professional Bio</Label>
                        <Textarea name="bio" defaultValue={expert?.bio} className="h-32 resize-none" placeholder="I have over 10 years of experience..." />
                    </div>

                    <div className="space-y-2">
                        <Label>Expertise Tags (Press Enter)</Label>
                        <TagInput placeholder="Add skill..." tags={tags} setTags={setTags} />
                    </div>
                </CardContent>
              </Card>
          </div>
        </TabsContent>

        {/* 2. SERVICES TAB */}
        <TabsContent value="services" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-medium">Services</h3><p className="text-sm text-zinc-500">Manage your offerings.</p></div>
                <Button type="button" onClick={addService} size="sm" className="bg-zinc-900 text-white"><Plus className="h-4 w-4 mr-2"/> Add Service</Button>
            </div>
            {services.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-center">
                    <Briefcase className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No services yet.</p>
                    <Button type="button" onClick={addService} variant="link" className="text-zinc-900">Create one</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {services.map((svc, idx) => (
                        <Card key={idx} className="group border-zinc-200">
                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Name</Label>
                                        <Input value={svc.name} onChange={(e) => updateService(idx, 'name', e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Type</Label>
                                        <Select value={svc.type} onValueChange={(val) => updateService(idx, 'type', val)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="video">Video</SelectItem><SelectItem value="clinic">Clinic</SelectItem><SelectItem value="chat">Chat</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <Label className="text-xs text-zinc-500">Price ($)</Label>
                                        <Input type="number" value={svc.price} onChange={(e) => updateService(idx, 'price', parseFloat(e.target.value))} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeService(idx)} className="absolute -right-12 top-5 text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* 3. AVAILABILITY TAB (Keeping it simple for brevity, same logic as above) */}
        <TabsContent value="availability" className="space-y-6">
             <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-medium">Schedule</h3><p className="text-sm text-zinc-500">Set your hours.</p></div>
                <Button type="button" onClick={addSlot} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Add Slot</Button>
            </div>
            {availability.map((slot, idx) => (
                <div key={idx} className="flex gap-4 p-4 border rounded-xl items-center bg-white">
                    <Select value={slot.dayOfWeek} onValueChange={(val) => updateSlot(idx, 'dayOfWeek', val)}>
                        <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                        <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(idx, 'startTime', e.target.value)} className="w-32"/>
                    <span>to</span>
                    <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(idx, 'endTime', e.target.value)} className="w-32"/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(idx)}><Trash2 className="h-4 w-4 text-zinc-400"/></Button>
                </div>
            ))}
        </TabsContent>

        {/* 4. DOCUMENTS TAB (With Loading State) */}
        <TabsContent value="documents" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-zinc-200">
                <CardHeader>
                    <div className="flex justify-between"><CardTitle>Documents</CardTitle><div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Verification Required</div></div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {documents.map((doc, idx) => (
                        <div key={idx} className="flex justify-between p-3 border rounded-lg bg-zinc-50">
                            <div className="flex gap-3 items-center"><FileText className="h-5 w-5 text-zinc-400"/><span className="text-sm font-medium">{doc.title}</span></div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(idx)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                        </div>
                    ))}
                    
                    {/* UPLOAD ZONE WITH LOADER */}
                    <div className="relative border-2 border-dashed border-zinc-200 rounded-xl p-8 bg-zinc-50/30 flex flex-col items-center text-center">
                        {isDocUploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 text-zinc-900 animate-spin mb-2" />
                                <p className="text-sm font-medium text-zinc-700">Uploading...</p>
                            </div>
                        )}
                        <Plus className="h-8 w-8 text-zinc-300 mb-2" />
                        <p className="text-sm font-medium">Upload License / Certificate</p>
                        <div className="mt-4 w-40">
                            <UploadButton endpoint="expertDocument" 
                                onUploadBegin={() => setIsDocUploading(true)}
                                onClientUploadComplete={(res) => {
                                    if(res?.[0]) {
                                        setDocuments([...documents, { title: res[0].name, url: res[0].url, type: "pdf" }]);
                                        toast.success("Document attached");
                                    }
                                    setIsDocUploading(false);
                                }}
                                onUploadError={() => { toast.error("Upload failed"); setIsDocUploading(false); }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 5. SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Timezone</Label><Select name="timezone" defaultValue={expert?.timezone}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Location</Label><Input name="location" defaultValue={expert?.location}/></div>
                    <div className="col-span-2 space-y-2"><Label>Languages</Label><TagInput placeholder="Add..." tags={languages} setTags={setLanguages}/></div>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </form>
  );
}