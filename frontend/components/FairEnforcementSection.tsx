"use client";

import React from "react";
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle, 
  Smartphone, 
  HelpCircle, 
  Scale, 
  Eye, 
  AlertCircle 
} from "lucide-react";

export function FairEnforcementSection() {
  const principles = [
    {
      icon: Scale,
      title: "Virtual Stop Lines",
      subtitle: "No accidental fines when braking",
      color: "bg-[#BAE2EF]",
      description:
        "Drivers often stop slightly over the painted line while slowing down safely. Our system uses a virtual crossing zone that only records true junction crossing violations, protecting careful motorists.",
    },
    {
      icon: MapPin,
      title: "Point-to-Point Corridor Speed",
      subtitle: "Fair average speed, no brake traps",
      color: "bg-[#DCE9C5]",
      description:
        "Traditional speed traps cause sudden dangerous braking. By calculating elapsed travel time between two cameras (2.5 km apart), we encourage smooth, safe driving throughout the city.",
    },
    {
      icon: Eye,
      title: "Human Officer in the Loop",
      subtitle: "Zero unverified AI tickets",
      color: "bg-[#F2B29A]",
      description:
        "AI never issues a penalty alone. Every flagged event is reviewed by a verified police officer on a dedicated screen to confirm vehicle identity and road conditions before dispatch.",
    },
    {
      icon: Smartphone,
      title: "45-Second WhatsApp Proof",
      subtitle: "Full evidence straight to your phone",
      color: "bg-white",
      description:
        "Forget about surprise court notices arriving six months late in the mail. You get an immediate WhatsApp message with high-resolution video frames, exact timestamps, and an online pay link.",
    },
  ];

  return (
    <section className="w-full my-12" aria-labelledby="fairness-title">
      <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-soft border border-[#EBEBEB]">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold text-[#6F7070] uppercase tracking-wider bg-[#F7F7F6] px-3.5 py-1 rounded-full border border-[#E5E5E5]">
            Built on Trust &amp; Transparency
          </span>
          <h2 id="fairness-title" className="text-2xl sm:text-3xl font-bold text-[#171717] mt-3 tracking-tight">
            Why Our Traffic System Is Fair to Every Driver
          </h2>
          <p className="text-[14px] text-[#6F7070] mt-2">
            Technology should protect motorists, not catch them on technicalities. Here is how our rule engine ensures accuracy and respect for everyday citizens.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-[24px] bg-[#F7F7F6] border border-[#E5E5E5] flex flex-col justify-between hover:bg-white hover:shadow-card-hover transition-all duration-200"
              >
                <div>
                  <div className={`w-11 h-11 rounded-full ${p.color} flex items-center justify-center text-[#171717] mb-4 shadow-2xs`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#171717]">
                    {p.title}
                  </h3>
                  <p className="text-[12px] font-medium text-[#54A8BD] mt-0.5 mb-2.5">
                    {p.subtitle}
                  </p>
                  <p className="text-[12px] text-[#6F7070] leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EAEAEA] flex items-center gap-1.5 text-[11px] font-semibold text-[#171717]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8CB64A]" strokeWidth={2.5} />
                  <span>Citizen Guarantee</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Impact Stats Banner */}
        <div className="mt-8 p-6 rounded-[24px] bg-[#DCE9C5]/40 border border-[#DCE9C5] grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
              -42%
            </div>
            <p className="text-xs text-[#2D4C13] mt-1 font-medium">
              Junction Collisions
            </p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
              99.4%
            </div>
            <p className="text-xs text-[#2D4C13] mt-1 font-medium">
              License Plate Accuracy
            </p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
              &lt; 45s
            </div>
            <p className="text-xs text-[#2D4C13] mt-1 font-medium">
              WhatsApp Notice Delivery
            </p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
              100%
            </div>
            <p className="text-xs text-[#2D4C13] mt-1 font-medium">
              Verifiable Video Proof
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
