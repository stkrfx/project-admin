"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Trash2, DollarSign } from "lucide-react";

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
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Services & Pricing</CardTitle>
                <CardDescription>Define what you offer to clients.</CardDescription>
            </div>
            <Button type="button" onClick={addService} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Add Service</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* EMPTY STATE */}
        {services.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/50 text-center">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Briefcase className="h-6 w-6 text-zinc-300" />
                </div>
                <h4 className="text-sm font-medium text-zinc-900">No services listed</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mb-4">
                    You won't appear in search results until you add at least one service (e.g. Video Consultation).
                </p>
                <Button type="button" onClick={addService} size="sm" className="bg-zinc-900 text-white">Create First Service</Button>
            </div>
        )}

        {/* SERVICE CARDS */}
        <div className="grid gap-4">
            {services.map((svc, idx) => (
                <div key={idx} className="group p-5 border border-zinc-200 rounded-xl bg-white hover:border-zinc-300 transition-all shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                            
                            {/* Row 1 */}
                            <div className="md:col-span-6 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Service Name</Label>
                                <Input 
                                    value={svc.name} 
                                    onChange={(e) => updateService(idx, 'name', e.target.value)} 
                                    placeholder="e.g. Initial Consultation"
                                    className="font-medium"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Type</Label>
                                <Select value={svc.type} onValueChange={(val) => updateService(idx, 'type', val)}>
                                    <SelectTrigger className="h-10 bg-zinc-50/50"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">Video Call</SelectItem>
                                        <SelectItem value="clinic">In-Person Clinic</SelectItem>
                                        <SelectItem value="chat">Chat Session</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Price (AUD)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                    <Input 
                                        type="number" 
                                        value={svc.price} 
                                        onChange={(e) => updateService(idx, 'price', parseFloat(e.target.value))} 
                                        className="pl-8"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="md:col-span-9 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Description (Optional)</Label>
                                <Input 
                                    value={svc.description} 
                                    onChange={(e) => updateService(idx, 'description', e.target.value)} 
                                    placeholder="e.g. A comprehensive 60-min review..."
                                    className="text-sm text-zinc-600 bg-zinc-50/30"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Duration (min)</Label>
                                <Input 
                                    type="number" 
                                    value={svc.duration} 
                                    onChange={(e) => updateService(idx, 'duration', parseInt(e.target.value))} 
                                    placeholder="60"
                                />
                            </div>
                        </div>

                        {/* Delete Action */}
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeService(idx)} 
                            className="text-zinc-300 hover:text-red-500 hover:bg-red-50 -mt-1"
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}