"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, GraduationCap, Plus, Trash2, Hash, Calendar, Building2, Award } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/ui/tag-input"; 
import { cn } from "@/lib/utils";

export function ProfessionalSection({ expert, tags = [], setTags, workHistory = [], setWorkHistory, education = [], setEducation }) {
  
  // Helpers
  const addJob = () => setWorkHistory([...workHistory, { company: "", role: "", startDate: "", endDate: "", current: false }]);
  const removeJob = (index) => setWorkHistory(workHistory.filter((_, i) => i !== index));
  const updateJob = (index, field, val) => { 
      const newJobs = [...workHistory]; 
      // Safety check: ensure it's an object before setting property
      if (typeof newJobs[index] !== 'object') newJobs[index] = { company: "", role: "", startDate: "", endDate: "", current: false };
      newJobs[index][field] = val; 
      setWorkHistory(newJobs); 
  };

  const addEdu = () => setEducation([...education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", current: false }]);
  const removeEdu = (index) => setEducation(education.filter((_, i) => i !== index));
  const updateEdu = (index, field, val) => { 
      const newEdu = [...education]; 
      // Safety check
      if (typeof newEdu[index] !== 'object') newEdu[index] = { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", current: false };
      newEdu[index][field] = val; 
      setEducation(newEdu); 
  };

  return (
    <div className="space-y-8">
      
      {/* 1. PROFESSIONAL BIO */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6">
            <CardTitle className="text-lg flex items-center gap-2 text-zinc-900"><Briefcase className="h-5 w-5 text-indigo-600"/> Professional Brand</CardTitle>
            <CardDescription>Your headline and bio are the first things clients see.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Headline</Label>
                <Input 
                    name="specialization" 
                    defaultValue={expert?.specialization} 
                    placeholder="e.g. Senior Clinical Psychologist & CBT Specialist" 
                    className="h-12 text-lg font-medium border-zinc-200 focus:ring-indigo-500" 
                />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">About You</Label>
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">Min 50 characters</span>
                </div>
                <Textarea 
                    name="bio" 
                    defaultValue={expert?.bio} 
                    placeholder="Share your professional journey, expertise, and how you help clients..." 
                    className="min-h-[160px] text-base leading-relaxed border-zinc-200 focus:ring-indigo-500 resize-y p-4" 
                />
            </div>
        </CardContent>
      </Card>

      {/* 2. WORK EXPERIENCE */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-900"><Building2 className="h-5 w-5 text-emerald-600"/> Work Experience</CardTitle>
                <CardDescription>Add your past roles to calculate total experience.</CardDescription>
            </div>
            <Button size="sm" onClick={addJob} variant="outline" className="h-9 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-zinc-200 shadow-sm text-zinc-700">
                <Plus className="h-3.5 w-3.5 mr-2"/> Add Role
            </Button>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
            {workHistory.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-zinc-100 rounded-xl">
                    <p className="text-sm text-zinc-400">No work history added yet.</p>
                </div>
            ) : (
                <div className="space-y-6 relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-zinc-200 hidden md:block"></div>
                    {workHistory.map((job, i) => (
                        <div key={i} className="relative md:pl-12">
                            <div className="absolute left-[13px] top-6 w-3 h-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm hidden md:block z-10 ring-1 ring-emerald-100"></div>
                            <div className="p-5 border border-zinc-200 rounded-xl bg-white relative group hover:border-emerald-300 hover:shadow-md transition-all">
                                <Button variant="ghost" size="icon" onClick={() => removeJob(i)} className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-4 w-4"/></Button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">Company Name</Label><div className="relative"><Building2 className="absolute left-3 top-3 h-4 w-4 text-zinc-400" /><Input value={job.company} onChange={(e) => updateJob(i, 'company', e.target.value)} placeholder="e.g. Google" className="pl-9 h-10"/></div></div>
                                    <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">Role Title</Label><Input value={job.role} onChange={(e) => updateJob(i, 'role', e.target.value)} placeholder="e.g. Senior Engineer" className="h-10 font-medium"/></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">Start Date</Label><Input type="date" value={job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : ''} onChange={(e) => updateJob(i, 'startDate', e.target.value)} className="h-9"/></div>
                                        <div className="space-y-1.5 relative">
                                            <Label className="text-xs font-semibold text-zinc-500">End Date</Label>
                                            <Input type="date" value={job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : ''} onChange={(e) => updateJob(i, 'endDate', e.target.value)} className="h-9 disabled:opacity-50" disabled={job.current} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pb-2"><Checkbox id={`curr-${i}`} checked={job.current} onCheckedChange={(c) => updateJob(i, 'current', c)} className="data-[state=checked]:bg-emerald-600 border-zinc-300" /><Label htmlFor={`curr-${i}`} className="cursor-pointer text-sm font-medium">I currently work here</Label></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      {/* 3. EDUCATION */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><GraduationCap className="h-4 w-4 text-blue-600" /></div><div><CardTitle className="text-lg">Education</CardTitle><CardDescription>Academic background and certifications.</CardDescription></div></div>
            <Button size="sm" onClick={addEdu} variant="outline" className="h-9 gap-2 text-zinc-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200"><Plus className="h-3.5 w-3.5"/> Add Degree</Button>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
            {education.map((edu, i) => (
                <div key={i} className="p-5 border border-zinc-200 rounded-xl bg-white space-y-4 relative group hover:border-blue-300 hover:shadow-md transition-all">
                    <Button variant="ghost" size="icon" onClick={() => removeEdu(i)} className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-4 w-4"/></Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Institution</Label><Input value={edu.institution} onChange={(e) => updateEdu(i, 'institution', e.target.value)} placeholder="e.g. Harvard University" className="h-10"/></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Degree</Label><div className="relative"><Award className="absolute left-3 top-3 h-4 w-4 text-zinc-400" /><Input value={edu.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} placeholder="e.g. B.Sc, PhD" className="pl-9 h-10"/></div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Field of Study</Label><Input value={edu.fieldOfStudy} onChange={(e) => updateEdu(i, 'fieldOfStudy', e.target.value)} placeholder="e.g. Psychology" className="h-10"/></div>
                        <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">Start Year</Label><Input type="date" value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''} onChange={(e) => updateEdu(i, 'startDate', e.target.value)} className="h-9"/></div><div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">End Year</Label><Input type="date" value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''} onChange={(e) => updateEdu(i, 'endDate', e.target.value)} className="h-9"/></div></div>
                    </div>
                </div>
            ))}
            {education.length === 0 && <p className="text-center text-zinc-400 text-sm italic py-4">Add your educational background.</p>}
        </CardContent>
      </Card>

      {/* 4. SKILLS */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Hash className="h-4 w-4 text-purple-600" /></div><div><CardTitle className="text-lg">Skills & Expertise</CardTitle><CardDescription>Tags help clients find you in search.</CardDescription></div></div></CardHeader>
        <CardContent className="p-6 md:p-8"><TagInput placeholder="Type a skill and press Enter (e.g. Cognitive Therapy)..." tags={tags} setTags={setTags} className="bg-white p-3 rounded-xl border-zinc-200" /></CardContent>
      </Card>
    </div>
  );
}