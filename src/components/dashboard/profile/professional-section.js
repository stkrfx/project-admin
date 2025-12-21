"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, GraduationCap, Plus, Trash2, Hash, Building2, Award, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/ui/tag-input"; 
import { cn } from "@/lib/utils";
import { 
    Video, Play,  Loader2, Info, 
    UploadCloud, CheckCircle2, RefreshCw, X
  } from "lucide-react";
  import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// 1. Accept bio/specialization props from parent
export function ProfessionalSection({ 
    expert, 
    tags = [], setTags, 
    workHistory = [], setWorkHistory, 
    education = [], setEducation, 
    bio, setBio, 
    specialization, setSpecialization, 
    introVideo, setIntroVideo, // ⭐ NEW
    errors = {} 
}) {

    const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // --- HELPERS ---
  const addJob = () => setWorkHistory([...workHistory, { company: "", role: "", startDate: "", endDate: "", current: false }]);
  const removeJob = (index) => setWorkHistory(workHistory.filter((_, i) => i !== index));
  const updateJob = (index, field, val) => { 
      const newJobs = [...workHistory]; 
      if (!newJobs[index]) return;
      newJobs[index][field] = val; 
      setWorkHistory(newJobs); 
  };

  const addEdu = () => setEducation([...education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", current: false }]);
  const removeEdu = (index) => setEducation(education.filter((_, i) => i !== index));
  const updateEdu = (index, field, val) => { 
      const newEdu = [...education]; 
      if (!newEdu[index]) return;
      newEdu[index][field] = val; 
      setEducation(newEdu); 
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. PROFESSIONAL BIO */}
      <Card className={cn("border-zinc-200 shadow-sm bg-white transition-all", (errors.bio || errors.specialization) && "border-red-500 ring-1 ring-red-100")}>
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm text-indigo-600">
                    <Briefcase className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-zinc-900">Professional Brand</CardTitle>
                    <CardDescription>Your headline and bio are the first things clients see.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
            
            {/* Headline - FIXED: Changed to Controlled Input */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <Label className={cn("text-xs font-bold uppercase tracking-wide", errors.specialization ? "text-red-600" : "text-zinc-500")}>Headline</Label>
                    {errors.specialization && <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.specialization[0]}</span>}
                </div>
                <Input 
                    name="specialization" 
                    value={specialization || ""} 
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Senior Clinical Psychologist & CBT Specialist" 
                    className={cn("h-12 text-lg font-medium bg-white", errors.specialization && "border-red-300 focus-visible:ring-red-200")} 
                />
            </div>

            {/* Bio - FIXED: Changed to Controlled Textarea */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className={cn("text-xs font-bold uppercase tracking-wide", errors.bio ? "text-red-600" : "text-zinc-500")}>About You</Label>
                    {errors.bio && <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.bio[0]}</span>}
                </div>
                <Textarea 
                    name="bio" 
                    value={bio || ""} 
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your professional journey, expertise, and how you help clients..." 
                    className={cn("min-h-[160px] text-base leading-relaxed resize-y p-4 bg-white", errors.bio && "border-red-300 focus-visible:ring-red-200")} 
                />
                <p className="text-[10px] text-zinc-400 text-right">Min 50 characters required.</p>
            </div>
        </CardContent>
      </Card>

      {/* ⭐ NEXT LEVEL: INTRO VIDEO STUDIO */}
      <Card className="border-zinc-200 shadow-xl bg-white overflow-hidden group/card">
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-6 relative">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-zinc-900">Intro Video Studio</CardTitle>
              <CardDescription>Experts with a video intro get 80% more profile engagement.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            
            {/* LEFT: PREVIEW AREA */}
            <div className="lg:col-span-3 p-6 md:p-8 bg-zinc-900 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

                {introVideo ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 bg-black group/video">
                    <video 
                      src={introVideo} 
                      className="w-full h-full object-cover" 
                      controls 
                    />
                    {/* Floating Delete Action */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover/video:opacity-100 transition-all transform translate-y-2 group-hover/video:translate-y-0">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setIntroVideo("")}
                          className="rounded-full shadow-lg bg-red-600/90 hover:bg-red-600 backdrop-blur-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6 z-10">
                    <div className="relative inline-block">
                        <div className="h-20 w-20 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-700 mx-auto">
                            <Play className="h-10 w-10 opacity-20" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-rose-500 rounded-full flex items-center justify-center text-white border-4 border-zinc-900">
                            <Video className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-zinc-400 font-medium">Ready to introduce yourself?</p>
                        <p className="text-zinc-600 text-xs max-w-xs mx-auto">Record a 30-60 second clip highlighting your expertise and approach.</p>
                    </div>
                  </div>
                )}
            </div>

            {/* RIGHT: UPLOAD & TIPS */}
            <div className="lg:col-span-2 p-6 md:p-8 border-l border-zinc-100 flex flex-col justify-between space-y-8">
              
              <div className="space-y-6">
                {!introVideo ? (
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Upload Video</Label>
                    <div className={cn(
                        "relative border-2 border-dashed rounded-2xl transition-all duration-300",
                        isUploading ? "border-rose-200 bg-rose-50/30" : "border-zinc-200 hover:border-rose-400 hover:bg-zinc-50"
                    )}>
                      {!isUploading ? (
                        <UploadDropzone
                            endpoint="introVideo"
                            onUploadProgress={(p) => setUploadProgress(p)}
                            onUploadBegin={() => setIsUploading(true)}
                            onClientUploadComplete={(res) => {
                                setIsUploading(false);
                                setUploadProgress(0);
                                if (res?.[0]) {
                                    setIntroVideo(res[0].url);
                                    toast.success("Video ready! Preview it on the left.");
                                }
                            }}
                            onUploadError={(error) => {
                                setIsUploading(false);
                                setUploadProgress(0);
                                toast.error(`Upload failed: ${error.message}`);
                            }}
                            appearance={{
                                container: { border: 'none', padding: '2rem' },
                                label: { color: '#71717a', fontSize: '0.875rem' },
                                allowedContent: { display: 'none' },
                                button: { 
                                    backgroundColor: '#18181b', 
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem',
                                    padding: '0 1.5rem'
                                }
                            }}
                            content={{
                                label: "Drag video or click to browse",
                            }}
                        />
                      ) : (
                        <div className="p-8 text-center space-y-4">
                            <div className="relative inline-block">
                                <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-rose-600">
                                    {uploadProgress}%
                                </span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-zinc-900">Uploading your intro...</p>
                                <Progress value={uploadProgress} className="h-1.5 w-full bg-zinc-100" />
                                <p className="text-[10px] text-zinc-400">Please don't close this tab</p>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">Your video is live!</span>
                     </div>
                     <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-xl border-zinc-200 hover:bg-zinc-50 gap-2"
                        onClick={() => setIntroVideo("")}
                     >
                        <RefreshCw className="h-4 w-4" /> Replace Video
                     </Button>
                  </div>
                )}

                {/* PRO TIPS SECTION */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Info className="h-3 w-3" /> Quick Tips
                    </Label>
                    <div className="grid gap-3">
                        <TipItem text="Keep it under 60 seconds." />
                        <TipItem text="Ensure your face is well-lit." />
                        <TipItem text="Briefly mention your specialization." />
                    </div>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                * Max 5 mins (128MB). Supported formats: MP4, MOV, WebM.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. WORK EXPERIENCE */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm text-emerald-600">
                    <Building2 className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-zinc-900">Work Experience</CardTitle>
                    <CardDescription>Add your roles to calculate total experience.</CardDescription>
                </div>
            </div>
            <Button type="button" size="sm" onClick={addJob} variant="outline" className="h-9 bg-white hover:bg-emerald-50 hover:text-emerald-700 border-zinc-200 shadow-sm text-zinc-700">
                <Plus className="h-3.5 w-3.5 mr-2"/> Add Role
            </Button>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
            {workHistory.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/30">
                    <Building2 className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-zinc-900">No work history added yet.</p>
                    <p className="text-xs text-zinc-500 mt-1">Add your past roles to showcase your career growth.</p>
                </div>
            ) : (
                <div className="space-y-6 relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-zinc-200 hidden md:block"></div>
                    {workHistory.map((job, i) => (
                        <div key={i} className="relative md:pl-12">
                            <div className="absolute left-[13px] top-6 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm hidden md:block z-10 ring-1 ring-emerald-100"></div>
                            
                            <div className="p-5 border border-zinc-200 rounded-xl bg-white relative group hover:border-emerald-300 hover:shadow-md transition-all">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeJob(i)} className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="h-4 w-4"/>
                                </Button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Company Name</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                            {/* Fix: Fallback to "" */}
                                            <Input value={job.company || ""} onChange={(e) => updateJob(i, 'company', e.target.value)} placeholder="e.g. Google" className="pl-9 h-10 border-zinc-200 focus:ring-emerald-500"/>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Role Title</Label>
                                        <Input value={job.role || ""} onChange={(e) => updateJob(i, 'role', e.target.value)} placeholder="e.g. Senior Engineer" className="h-10 font-medium border-zinc-200 focus:ring-emerald-500"/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-zinc-500">Start Date</Label>
                                            <Input type="date" value={job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : ''} onChange={(e) => updateJob(i, 'startDate', e.target.value)} className="h-9 border-zinc-200"/>
                                        </div>
                                        <div className="space-y-1.5 relative">
                                            <Label className="text-xs font-semibold text-zinc-500">End Date</Label>
                                            <Input type="date" value={job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : ''} onChange={(e) => updateJob(i, 'endDate', e.target.value)} className="h-9 border-zinc-200 disabled:opacity-50" disabled={job.current} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pb-2">
                                        <Checkbox id={`curr-${i}`} checked={!!job.current} onCheckedChange={(c) => updateJob(i, 'current', c)} className="data-[state=checked]:bg-emerald-600 border-zinc-300" />
                                        <Label htmlFor={`curr-${i}`} className="cursor-pointer text-sm font-medium text-zinc-700">I currently work here</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      {/* 3. EDUCATION */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm text-blue-600"><GraduationCap className="h-5 w-5" /></div>
                <div><CardTitle className="text-lg font-bold text-zinc-900">Education</CardTitle><CardDescription>Academic background and certifications.</CardDescription></div>
            </div>
            <Button type="button" size="sm" onClick={addEdu} variant="outline" className="h-9 bg-white hover:bg-blue-50 hover:text-blue-700 border-zinc-200 shadow-sm text-zinc-700"><Plus className="h-3.5 w-3.5 mr-2"/> Add Degree</Button>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
            {education.map((edu, i) => (
                <div key={i} className="p-5 border border-zinc-200 rounded-xl bg-white space-y-4 relative group hover:border-blue-300 hover:shadow-md transition-all">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEdu(i)} className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-4 w-4"/></Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Institution</Label><Input value={edu.institution || ""} onChange={(e) => updateEdu(i, 'institution', e.target.value)} placeholder="e.g. Harvard University" className="h-10 border-zinc-200 focus:ring-blue-500"/></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Degree</Label><div className="relative"><Award className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" /><Input value={edu.degree || ""} onChange={(e) => updateEdu(i, 'degree', e.target.value)} placeholder="e.g. B.Sc, PhD" className="pl-9 h-10 border-zinc-200 focus:ring-blue-500"/></div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Field of Study</Label><Input value={edu.fieldOfStudy || ""} onChange={(e) => updateEdu(i, 'fieldOfStudy', e.target.value)} placeholder="e.g. Psychology" className="h-10 border-zinc-200 focus:ring-blue-500"/></div>
                        <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">Start Year</Label><Input type="date" value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''} onChange={(e) => updateEdu(i, 'startDate', e.target.value)} className="h-9 border-zinc-200"/></div><div className="space-y-1.5"><Label className="text-xs font-semibold text-zinc-500">End Year</Label><Input type="date" value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''} onChange={(e) => updateEdu(i, 'endDate', e.target.value)} className="h-9 border-zinc-200"/></div></div>
                    </div>
                </div>
            ))}
            {education.length === 0 && <div className="text-center py-8 border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/30"><GraduationCap className="h-12 w-12 text-zinc-300 mx-auto mb-3" /><p className="text-sm font-medium text-zinc-900">No education details added.</p></div>}
        </CardContent>
      </Card>

      {/* 4. SKILLS */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm text-purple-600"><Hash className="h-5 w-5" /></div><div><CardTitle className="text-lg font-bold text-zinc-900">Skills & Expertise</CardTitle><CardDescription>Tags help clients find you in search.</CardDescription></div></div></CardHeader>
        <CardContent className="p-6 md:p-8"><TagInput placeholder="Type a skill (e.g. CBT)..." tags={tags} setTags={setTags} className="bg-white p-3 rounded-xl border-zinc-200 focus-within:ring-2 focus-within:ring-purple-100 transition-all" /></CardContent>
      </Card>
    </div>
  );
}



function TipItem({ text }) {
    return (
        <div className="flex items-start gap-2 group">
            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 group-hover:scale-125 transition-transform" />
            <p className="text-xs text-zinc-500 leading-tight">{text}</p>
        </div>
    );
}