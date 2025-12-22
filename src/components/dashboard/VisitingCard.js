"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, ShieldCheck, Brain } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function VisitingCard({ profile }) {
  const cardRef = useRef(null);
  
  const publicProfileUrl = `https://digitaloffices.com.au/experts/${profile._id}`;

  const downloadCard = async () => {
    if (cardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        backgroundColor: '#09090b' 
      });
      const link = document.createElement("a");
      link.download = `${profile.user?.name || 'Expert'}-Card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating card image:", err);
    }
  };

  return (
    <>
      <div className="absolute -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={cardRef}
          className="w-[600px] h-[350px] bg-zinc-950 text-white p-10 flex flex-col justify-between border border-zinc-800 rounded-2xl relative overflow-hidden"
        >
          {/* Design Elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />

          <div className="flex justify-between items-start z-10">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-emerald-500/20">
                  <AvatarImage src={profile.user?.image} />
                  <AvatarFallback className="bg-zinc-800 text-2xl">
                    {profile.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight">{profile.user?.name}</h3>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{profile.specialization || "Professional Expert"}</span>
                  </div>
                </div>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-[320px] line-clamp-3">
                {profile.bio || "Verified professional profile and consultation services."}
              </p>
            </div>

            {/* Updated QR Code with White Icon on Black Rounded Background */}
            <div className="bg-white p-3 rounded-xl shadow-xl shadow-emerald-500/5 relative">
              <QRCodeSVG 
                value={publicProfileUrl} 
                size={120} 
                level="H" 
                includeMargin={false}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Rounded square container with black background */}
                <div className="bg-zinc-900 p-1.5 rounded-lg shadow-sm border border-white/10">
                   {/* White icon */}
                   <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end z-10 border-t border-zinc-800/50 pt-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                <Brain className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Mindnamo
              </span>
            </div>
            
            <p className="text-xs text-zinc-500 italic">Scan to book an appointment</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={downloadCard}
        variant="outline" 
        className="rounded-full gap-2 border-emerald-100 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download Visiting Card
      </Button>
    </>
  );
}