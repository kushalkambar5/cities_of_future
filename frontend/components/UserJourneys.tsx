"use client";

import React, { useState } from "react";
import { 
  UserCheck, 
  ShieldAlert, 
  Sliders, 
  Smartphone, 
  Eye, 
  CreditCard, 
  Award, 
  Map, 
  CheckCircle, 
  Search, 
  BarChart2, 
  Video, 
  SendHorizontal,
  ChevronRight
} from "lucide-react";

export function UserJourneys() {
  const [activeTab, setActiveTab] = useState<"citizen" | "police" | "admin">("citizen");

  const journeys = {
    citizen: {
      title: "For Everyday Citizens & Drivers",
      tagline: "Clarity, fairness, and zero surprise penalties",
      badge: "Citizen Portal",
      steps: [
        {
          icon: Smartphone,
          title: "Instant WhatsApp Notification",
          description: "No waiting for postal notices or surprise court summons. Get a clean WhatsApp message with date, location, and fine amount within 60 seconds.",
        },
        {
          icon: Eye,
          title: "Transparent Photo & Video Proof",
          description: "See the high-definition camera frame and video clip highlighting your vehicle's license plate and the exact speed reading.",
        },
        {
          icon: CreditCard,
          title: "30-Second Online Settlement",
          description: "Review your notice and resolve it directly from your smartphone with one click. No paperwork or visits to police stations.",
        },
        {
          icon: Award,
          title: "Safe Driver Recognition",
          description: "Track your vehicle safety score, view past clean records, and celebrate responsible driving on city roads.",
        },
      ],
      previewHeadline: "Rahul's Experience with Notice #V1023",
      previewQuote: "I got a WhatsApp notification while parking. Instead of wondering what happened, I clicked the link, saw the clear photo of my car crossing the stop line at MG Road, and cleared it in under 30 seconds.",
    },
    police: {
      title: "For Traffic Police & Patrol Officers",
      tagline: "Assisted intelligence for safer city intersections",
      badge: "Command Center",
      steps: [
        {
          icon: Map,
          title: "3D Bird's-Eye Command Center",
          description: "Monitor city intersections, CCTV cameras, and traffic lights simultaneously on an intuitive 3D map.",
        },
        {
          icon: ShieldAlert,
          title: "Real-Time AI Detection Queue",
          description: "AI continuously flags overspeeding, red light violations, and helmet compliance with confidence scores.",
        },
        {
          icon: CheckCircle,
          title: "1-Click Human Verification",
          description: "Officers maintain final authority. Inspect flagged video evidence and confirm or dismiss the notice with a single tap.",
        },
        {
          icon: Search,
          title: "Rapid Vehicle History Lookup",
          description: "Instantly search any registration plate to view registered owner contact, past offenses, and safety profile.",
        },
      ],
      previewHeadline: "Officer Vikram at Central Traffic HQ",
      previewQuote: "The 3D map flags genuine hotspots immediately. Because AI pre-screens the video frames, we verify 10x more violations with 100% evidence backing.",
    },
    admin: {
      title: "For Municipal Admins & City Planners",
      tagline: "Complete urban corridor safety and infrastructure management",
      badge: "Administration",
      steps: [
        {
          icon: Video,
          title: "Visual 3D Camera & Light Setup",
          description: "Place virtual CCTV cameras and traffic signals directly on the 3D map, configure speed limits, and link intersections.",
        },
        {
          icon: BarChart2,
          title: "Accident & Hotspot Heatmaps",
          description: "Identify high-risk corridors and dangerous junctions to deploy road safety interventions where they matter most.",
        },
        {
          icon: SendHorizontal,
          title: "Automated Evidence Delivery",
          description: "Seamless integration between vehicle registries and WhatsApp messaging ensures zero manual printing or lost mail.",
        },
        {
          icon: Sliders,
          title: "Simulation & Calibration",
          description: "Upload video feeds, synchronize simulation time, and calibrate detection thresholds before expanding corridor coverage.",
        },
      ],
      previewHeadline: "Smart City Operations Director",
      previewQuote: "Urban traffic safety requires trust. By combining automated detection with transparent proof and open citizen resolution, compliance has risen by 42%.",
    },
  };

  const current = journeys[activeTab];

  return (
    <section className="w-full my-12" aria-labelledby="user-journeys-title">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-[11px] font-bold text-[#6F7070] uppercase tracking-wider bg-white px-3.5 py-1 rounded-full border border-[#E5E5E5] shadow-2xs">
          Built for Everyday Use
        </span>
        <h2 id="user-journeys-title" className="text-2xl sm:text-3xl font-bold text-[#171717] mt-3 tracking-tight">
          Designed for People, Not Just Systems
        </h2>
        <p className="text-[14px] text-[#6F7070] mt-2">
          Discover how citizens, traffic officers, and city planners each experience a smoother, fairer traffic safety network.
        </p>

        {/* Tab Selector */}
        <div className="flex items-center justify-center gap-2 mt-6 p-1.5 bg-white rounded-full border border-[#E5E5E5] shadow-soft max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("citizen")}
            className={`flex-1 py-2 px-3 rounded-full text-[12px] font-semibold transition-all ${
              activeTab === "citizen"
                ? "bg-[#171717] text-white shadow-xs"
                : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
            }`}
          >
            Citizens
          </button>
          <button
            onClick={() => setActiveTab("police")}
            className={`flex-1 py-2 px-3 rounded-full text-[12px] font-semibold transition-all ${
              activeTab === "police"
                ? "bg-[#171717] text-white shadow-xs"
                : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
            }`}
          >
            Traffic Police
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 px-3 rounded-full text-[12px] font-semibold transition-all ${
              activeTab === "admin"
                ? "bg-[#171717] text-white shadow-xs"
                : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
            }`}
          >
            City Planners
          </button>
        </div>
      </div>

      {/* Main Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {current.steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-[24px] p-6 shadow-soft border border-[#EBEBEB] flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-200"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#171717] mb-4">
                  <Icon className="w-5 h-5 text-[#54A8BD]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-bold text-[#171717] mb-2">
                  {step.title}
                </h3>
                <p className="text-[12px] text-[#6F7070] leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F5F5F5] flex items-center justify-between text-[11px] font-semibold text-[#171717]">
                <span>Step 0{idx + 1}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#999999]" strokeWidth={2} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Life Experience Spotlight Quote */}
      <div className="mt-6 bg-[#BAE2EF]/50 rounded-[24px] p-6 sm:p-7 border border-[#BAE2EF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold text-[#54A8BD] uppercase tracking-wider block mb-1">
            Real Experience Snapshot • {current.badge}
          </span>
          <h4 className="text-[15px] font-bold text-[#171717]">
            {current.previewHeadline}
          </h4>
          <p className="text-[13px] text-[#171717]/85 mt-1.5 italic leading-relaxed">
            &ldquo;{current.previewQuote}&rdquo;
          </p>
        </div>

        <div className="shrink-0 bg-white px-4 py-2 rounded-full shadow-2xs text-[12px] font-semibold text-[#171717]">
          Verified Journey
        </div>
      </div>
    </section>
  );
}
