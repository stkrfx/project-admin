"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Trash2, DollarSign, Video, MapPin, MessageCircle, Clock } from "lucide-react";

export function ServicesSection({ services, setServices }) {
  
  const addService = () => setServices([...services, { name: "", type: "video", price: 0, duration: 60, description: "" }]);
  
  const updateService = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const removeService = (index) => setServices(services.filter((_, i) => i !== index));

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="border-b border-zinc-100 mb-6 pb-4">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-500" /> Services & Pricing</CardTitle>
                <CardDescription>What can clients book you for?</CardDescription>
            </div>
            <Button type="button" onClick={addService} size="sm" className="bg-zinc-900 text-white shadow-md hover:bg-zinc-800"><Plus className="h-4 w-4 mr-2"/> Add Service</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {services.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/30 text-center">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Briefcase className="h-6 w-6 text-zinc-300" />
                </div>
                <h4 className="text-sm font-medium text-zinc-900">No services listed</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mb-4">
                    Start by adding your primary consultation type.
                </p>
                <Button type="button" onClick={addService} size="sm" variant="outline">Create Service</Button>
            </div>
        )}

        <div className="grid gap-4">
            {services.map((svc, idx) => (
                <div key={idx} className="group p-5 border border-zinc-200 rounded-xl bg-white hover:border-zinc-300 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
                            
                            {/* Line 1 */}
                            <div className="md:col-span-6 space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Service Name</Label>
                                <Input 
                                    value={svc.name} 
                                    onChange={(e) => updateService(idx, 'name', e.target.value)} 
                                    placeholder="e.g. Initial Video Consultation"
                                    className="font-medium text-zinc-900 h-10"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Type</Label>
                                <Select value={svc.type} onValueChange={(val) => updateService(idx, 'type', val)}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video"><div className="flex items-center gap-2"><Video className="h-4 w-4 text-blue-500"/> Video Call</div></SelectItem>
                                        <SelectItem value="clinic"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500"/> In-Person</div></SelectItem>
                                        <SelectItem value="chat"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500"/> Chat</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Price (AUD)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input 
                                        type="number" 
                                        value={svc.price} 
                                        onChange={(e) => updateService(idx, 'price', parseFloat(e.target.value))} 
                                        className="pl-9 h-10 font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Line 2 */}
                            <div className="md:col-span-9 space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Description</Label>
                                <Input 
                                    value={svc.description} 
                                    onChange={(e) => updateService(idx, 'description', e.target.value)} 
                                    placeholder="Briefly describe what this service includes..."
                                    className="h-10 text-sm text-zinc-600"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Duration</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input 
                                        type="number" 
                                        value={svc.duration} 
                                        onChange={(e) => updateService(idx, 'duration', parseInt(e.target.value))} 
                                        placeholder="60"
                                        className="pl-9 h-10"
                                    />
                                    <span className="absolute right-3 top-3 text-xs text-zinc-400">min</span>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeService(idx)} 
                            className="text-zinc-300 hover:text-red-500 hover:bg-red-50 mt-1"
                        >
                            <Trash2 className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}