"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, Trash2, Video, Phone, MessageSquare, MapPin, Clock, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = [
  { value: "video", label: "Video Call", icon: Video },
  { value: "clinic", label: "In-Person", icon: MapPin },
  { value: "phone", label: "Phone Call", icon: Phone },
  { value: "chat", label: "Chat / Text", icon: MessageSquare },
];

export function ServicesSection({ services, setServices, errors = {} }) {
  
  const addService = () => {
    setServices([...services, { name: "", type: "video", duration: 60, price: 0, currency: "AUD", description: "" }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index, field, val) => {
    const newServices = [...services];
    // Safety
    if (!newServices[index]) return;

    if (field === "price" || field === "duration") {
        newServices[index][field] = Number(val);
    } else {
        newServices[index][field] = val;
    }
    setServices(newServices);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* GLOBAL ERROR FOR SERVICES */}
      {errors.services && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-pulse">
            <AlertCircle className="h-4 w-4" />
            {typeof errors.services === 'string' ? errors.services : "Please check your services configuration."}
        </div>
      )}

      <Card className={cn("border-zinc-200 shadow-sm bg-white", errors.services && "border-red-300 ring-1 ring-red-100")}>
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm text-amber-500">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-zinc-900">Services & Pricing</CardTitle>
                    <CardDescription>Define what you offer and how much you charge.</CardDescription>
                </div>
            </div>
            <Button size="sm" onClick={addService} variant="default" className="h-9 bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm">
                <Plus className="h-3.5 w-3.5 mr-2"/> Add Service
            </Button>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8 bg-zinc-50/20 min-h-[300px]">
            {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-zinc-200 rounded-2xl bg-white">
                    <div className="h-14 w-14 bg-zinc-50 rounded-full flex items-center justify-center mb-4"><Sparkles className="h-6 w-6 text-zinc-300" /></div>
                    <h3 className="text-sm font-bold text-zinc-900">No services listed</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-4">Start earning by adding your first consultation service.</p>
                    <Button variant="outline" onClick={addService} className="h-9 text-xs">Create Service</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {services.map((service, i) => (
                        <div key={i} className="group relative bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button variant="ghost" size="icon" onClick={() => removeService(i)} className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                                    <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Service Name</Label><Input value={service.name || ""} onChange={(e) => updateService(i, 'name', e.target.value)} placeholder="e.g. Initial Consultation" className="h-10 font-semibold border-zinc-200 focus:ring-amber-500"/></div>
                                    <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Type</Label><Select value={service.type || "video"} onValueChange={(val) => updateService(i, 'type', val)}><SelectTrigger className="h-10 border-zinc-200 focus:ring-amber-500"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_TYPES.map(type => (<SelectItem key={type.value} value={type.value}><div className="flex items-center gap-2"><type.icon className="h-3.5 w-3.5 text-zinc-500" />{type.label}</div></SelectItem>))}</SelectContent></Select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-zinc-400 uppercase">Duration</Label><div className="relative"><Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" /><Input type="number" min="15" step="15" value={service.duration || 0} onChange={(e) => updateService(i, 'duration', e.target.value)} className="h-9 pl-9 pr-8 bg-white border-zinc-200 text-sm"/><span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-medium">min</span></div></div>
                                    <div className="space-y-1"><Label className="text-[10px] font-bold text-zinc-400 uppercase">Price (AUD)</Label><div className="relative"><DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" /><Input type="number" min="0" value={service.price || 0} onChange={(e) => updateService(i, 'price', e.target.value)} className="h-9 pl-8 bg-white border-zinc-200 text-sm font-semibold text-zinc-900"/></div></div>
                                </div>
                                <div className="space-y-1.5"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Description</Label><Textarea value={service.description || ""} onChange={(e) => updateService(i, 'description', e.target.value)} placeholder="What can clients expect?" className="h-20 text-sm resize-none border-zinc-200 focus:ring-amber-500"/></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}