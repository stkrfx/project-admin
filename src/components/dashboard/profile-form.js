"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/profile";
import { UploadButton } from "@/components/upload-button";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";
import { 
  Loader2, Save, User, Briefcase, MapPin, 
  Globe, GraduationCap, Clock, Link as LinkIcon, 
  FileText, Trash2, Plus, DollarSign, Calendar, 
  ShieldAlert, Sparkles, AlertCircle 
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
  
  // Data State
  const user = initialData.user || {};
  const expert = initialData.draft || initialData;

  const [tags, setTags] = useState(expert?.tags || []);
  const [languages, setLanguages] = useState(expert?.languages || []);
  const [documents, setDocuments] = useState(expert?.documents || []);
  const [services, setServices] = useState(expert?.services || []);
  const [availability, setAvailability] = useState(expert?.availability || []);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);
    
    // Inject complex state as JSON
    formData.set("tags", JSON.stringify(tags));
    formData.set("languages", JSON.stringify(languages));
    formData.set("documents", JSON.stringify(documents));
    formData.set("services", JSON.stringify(services));
    formData.set("availability", JSON.stringify(availability));

    const result = await updateProfile(formData);
    if (result.error) toast.error(result.error);
    else toast.success("Profile saved successfully!");
    
    setIsLoading(false);
  }

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
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto pb-20">
      
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Edit Profile</h2>
            <p className="text-sm text-zinc-500">Manage your public presence and booking settings.</p>
         </div>
         <div className="flex items-center gap-3">
            {isPending && (
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Verification
                </div>
            )}
            <Button type="submit" disabled={isLoading} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10 transition-all">
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>}
                Save Changes
            </Button>
         </div>
      </div>

      <Tabs defaultValue="identity" className="w-full space-y-8">
        <TabsList className="w-full justify-start border-b border-zinc-200 bg-transparent p-0 h-auto rounded-none space-x-6 overflow-x-auto">
          {["identity", "services", "availability", "documents", "settings"].map((tab) => (
            <TabsTrigger 
                key={tab}
                value={tab} 
                className="capitalize data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 data-[state=active]:shadow-none rounded-none px-2 py-3 text-sm text-zinc-500 hover:text-zinc-900 data-[state=active]:text-zinc-900 bg-transparent"
            >
                {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 1. IDENTITY TAB */}
        <TabsContent value="identity" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Avatar */}
              <Card className="lg:col-span-1 border-zinc-200 shadow-sm h-fit">
                <CardHeader>
                    <CardTitle className="text-base">Profile Picture</CardTitle>
                    <CardDescription>This will be displayed on your profile.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <Avatar className="h-32 w-32 border-4 border-zinc-50 shadow-xl">
                        <AvatarImage src={user.image} className="object-cover"/>
                        <AvatarFallback className="text-4xl bg-zinc-100 text-zinc-300">{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-2">
                        <UploadButton endpoint="profilePicture" 
                            onClientUploadComplete={(res) => {
                                if(res?.[0]) document.getElementById("hidden-image").value = res[0].url;
                                toast.success("Image uploaded!");
                            }}
                            appearance={{
                                button: { width: "100%", background: "#f4f4f5", color: "#18181b", fontSize: "12px" },
                                allowedContent: { display: "none" }
                            }}
                            content={{ button: "Change Photo" }}
                        />
                        <input type="hidden" name="image" id="hidden-image" defaultValue={user.image} />
                    </div>
                </CardContent>
              </Card>

              {/* Right: Info */}
              <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-zinc-500"/> Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input name="name" defaultValue={user.name} placeholder="e.g. Dr. Sarah Connor" />
                        </div>
                        <div className="space-y-2">
                            <Label>Professional Title</Label>
                            <Input name="specialization" defaultValue={expert?.specialization} placeholder="e.g. Senior Clinical Psychologist" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Professional Bio</Label>
                        <Textarea 
                            name="bio" 
                            defaultValue={expert?.bio} 
                            className="h-32 resize-none" 
                            placeholder="I have over 10 years of experience helping patients with..."
                        />
                        <p className="text-xs text-zinc-400 text-right">Write a compelling intro. Max 2000 chars.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Expertise Tags (Press Enter)</Label>
                        <TagInput 
                            placeholder="Type a skill (e.g. CBT, Anxiety) and press Enter..." 
                            tags={tags} 
                            setTags={setTags} 
                        />
                    </div>
                </CardContent>
              </Card>
          </div>
        </TabsContent>

        {/* 2. SERVICES TAB */}
        <TabsContent value="services" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-zinc-900">Services & Pricing</h3>
                    <p className="text-sm text-zinc-500">Add at least one service so clients can book you.</p>
                </div>
                <Button onClick={addService} size="sm" className="bg-zinc-900 text-white"><Plus className="h-4 w-4 mr-2"/> Add Service</Button>
            </div>

            {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-center">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Briefcase className="h-6 w-6 text-zinc-300" />
                    </div>
                    <h4 className="text-sm font-medium text-zinc-900">No services added yet</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs mb-4">
                        You need to define your services (e.g. Video Consultation) before your profile can go live.
                    </p>
                    <Button onClick={addService} variant="outline" size="sm">Create First Service</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {services.map((svc, idx) => (
                        <Card key={idx} className="group border-zinc-200 hover:border-zinc-300 transition-colors">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-xs text-zinc-500">Service Name</Label>
                                            <Input 
                                                value={svc.name} 
                                                onChange={(e) => updateService(idx, 'name', e.target.value)} 
                                                placeholder="e.g. Initial Consultation"
                                                className="font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-zinc-500">Type</Label>
                                            <Select value={svc.type} onValueChange={(val) => updateService(idx, 'type', val)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">Video Call</SelectItem>
                                                    <SelectItem value="clinic">In-Person Clinic</SelectItem>
                                                    <SelectItem value="chat">Chat Session</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-zinc-500">Price (AUD)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                                <Input 
                                                    type="number" 
                                                    value={svc.price} 
                                                    onChange={(e) => updateService(idx, 'price', parseFloat(e.target.value))} 
                                                    className="pl-8"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeService(idx)} 
                                        className="text-zinc-400 hover:text-red-500 hover:bg-red-50 -mt-1"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Description (Optional)</Label>
                                        <Input 
                                            value={svc.description} 
                                            onChange={(e) => updateService(idx, 'description', e.target.value)} 
                                            placeholder="e.g. A comprehensive 60-min review of your history..."
                                            className="text-sm text-zinc-600"
                                        />
                                    </div>
                                    <div className="w-24 space-y-1.5">
                                        <Label className="text-xs text-zinc-500">Duration (min)</Label>
                                        <Input 
                                            type="number" 
                                            value={svc.duration} 
                                            onChange={(e) => updateService(idx, 'duration', parseInt(e.target.value))} 
                                            placeholder="60"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* 3. AVAILABILITY TAB */}
        <TabsContent value="availability" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-zinc-900">Weekly Schedule</h3>
                    <p className="text-sm text-zinc-500">Set your recurring availability. Times are in your local timezone.</p>
                </div>
                <Button onClick={addSlot} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Add Slot</Button>
            </div>

            {availability.length === 0 ? (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>No availability set</AlertTitle>
                    <AlertDescription>
                        Your profile will appear as "Unavailable" until you add at least one time slot.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-3">
                    {availability.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:border-zinc-300 transition-all">
                            <div className="flex items-center gap-2 w-40">
                                <Calendar className="h-4 w-4 text-zinc-400" />
                                <Select value={slot.dayOfWeek} onValueChange={(val) => updateSlot(idx, 'dayOfWeek', val)}>
                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 px-0 h-auto font-medium text-zinc-900">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-1 bg-zinc-50 px-4 py-2 rounded-lg">
                                <Input 
                                    type="time" 
                                    value={slot.startTime} 
                                    onChange={(e) => updateSlot(idx, 'startTime', e.target.value)} 
                                    className="bg-transparent border-0 shadow-none focus-visible:ring-0 w-24 p-0 h-auto text-center font-mono"
                                />
                                <span className="text-zinc-400 text-xs uppercase">to</span>
                                <Input 
                                    type="time" 
                                    value={slot.endTime} 
                                    onChange={(e) => updateSlot(idx, 'endTime', e.target.value)} 
                                    className="bg-transparent border-0 shadow-none focus-visible:ring-0 w-24 p-0 h-auto text-center font-mono"
                                />
                            </div>

                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(idx)} className="text-zinc-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* 4. DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-blue-600"/> Credentials</CardTitle>
                            <CardDescription>Upload your licenses and degrees for verification.</CardDescription>
                        </div>
                        <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                            Admin Verification Required
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* List */}
                    {documents.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/50">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-9 w-9 rounded bg-white border flex items-center justify-center shrink-0">
                                            <FileText className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate text-zinc-900">{doc.title}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">{doc.type}</p>
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(idx)} className="h-8 w-8 text-zinc-400 hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload Zone */}
                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 bg-zinc-50/30 flex flex-col items-center text-center">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                            <Plus className="h-5 w-5 text-zinc-400" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-900">Upload New Document</h4>
                        <p className="text-xs text-zinc-500 mb-4">PDF or Images up to 8MB</p>
                        <div className="w-40">
                            <UploadButton endpoint="expertDocument" 
                                onClientUploadComplete={(res) => {
                                    if(res?.[0]) {
                                        setDocuments([...documents, { title: res[0].name, url: res[0].url, type: res[0].name.endsWith(".pdf") ? "pdf" : "image" }]);
                                        toast.success("Document attached");
                                    }
                                }}
                                appearance={{
                                    button: { background: "white", color: "black", border: "1px solid #e4e4e7", fontSize: "12px", padding: "8px" },
                                    allowedContent: { display: "none" }
                                }}
                                content={{ button: "Select File" }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 5. SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base flex gap-2"><Globe className="h-4 w-4"/> Regional Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Select name="timezone" defaultValue={expert?.timezone || "Australia/Sydney"}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                            <p className="text-[10px] text-zinc-500">Essential for accurate booking times.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input name="location" defaultValue={expert?.location} placeholder="City, Country" />
                        </div>
                        <div className="space-y-2">
                            <Label>Languages (Press Enter)</Label>
                            <TagInput placeholder="Add language..." tags={languages} setTags={setLanguages} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base flex gap-2"><LinkIcon className="h-4 w-4"/> Social Links</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>LinkedIn URL</Label>
                            <Input name="linkedin" defaultValue={expert?.socialLinks?.linkedin} placeholder="https://linkedin.com/in/..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Twitter / X URL</Label>
                            <Input name="twitter" defaultValue={expert?.socialLinks?.twitter} placeholder="https://twitter.com/..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Personal Website</Label>
                            <Input name="website" defaultValue={expert?.socialLinks?.website} placeholder="https://..." />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

      </Tabs>
    </form>
  );
}