"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Briefcase, GraduationCap } from "lucide-react";

export function ProfessionalSection({ expert, tags, setTags }) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-900">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              Professional Brand
          </CardTitle>
          <CardDescription>
              This info tells clients who you are. Changes here require <strong>Admin Verification</strong>.
          </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2 md:col-span-2">
            <Label>Primary Title / Specialization</Label>
            <Input 
              name="specialization" 
              placeholder="e.g. Senior Clinical Psychologist" 
              defaultValue={expert?.specialization}
              className="font-medium text-lg h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Highest Education</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                  name="education" 
                  className="pl-9"
                  placeholder="PhD, Harvard University" 
                  defaultValue={expert?.education}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Experience (Years)</Label>
            <Input 
              name="experienceYears" 
              type="number"
              placeholder="10" 
              defaultValue={expert?.experienceYears}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Professional Bio</Label>
            <Textarea 
              name="bio" 
              placeholder="Start with a strong hook about your expertise. Describe your approach and how you help clients..." 
              className="h-32 resize-none leading-relaxed"
              defaultValue={expert?.bio}
            />
            <p className="text-xs text-zinc-500 text-right">
              {expert?.bio?.length || 0}/2000 characters
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Skills & Expertise (Press Enter to add)</Label>
            <TagInput 
              placeholder="Type a skill (e.g. CBT, Anxiety, Startup Law)..." 
              tags={tags} 
              setTags={setTags} 
            />
          </div>
      </CardContent>
    </Card>
  );
}