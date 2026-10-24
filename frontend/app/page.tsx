"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  ShieldCheck, 
  Camera, 
  Smartphone, 
  Scale, 
  ChevronDown, 
  Check,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  HelpCircle,
  Activity,
  LogIn,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AuthModal } from "@/components/AuthModal";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");

  const openAuth = (tab: "signin" | "signup") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const faqItems = [
    {
      q: "How does Navanagar verify violation evidence?",
      a: "Every violation is captured by high-definition roadside cameras with precise timestamps and location metadata. Before any notice is generated, the captured video and photo frame must be manually reviewed and verified by a sworn traffic police officer in the loop.",
    },
    {
      q: "How does corridor average speed enforcement differ from spot speed traps?",
      a: "Traditional speed cameras only measure speed at a single point, which often causes hazardous sudden braking right in front of the camera. Navanagar calculates the average travel speed across a designated 2.5 km corridor between two camera checkpoints, encouraging consistent, safe driving.",
    },
    {
      q: "What is the Virtual Stop Line Buffer?",
      a: "Many automated camera traps penalize drivers whose front tires slightly touch or cross a painted line due to gradual braking. Navanagar implements a virtual buffer zone: vehicles that safely stop without obstructing pedestrian crossings or intersection traffic are not penalized.",
    },
    {
      q: "What if someone else was driving my vehicle?",
      a: "Vehicle owners receive an instant notice via WhatsApp and SMS containing full photo proof. Through the citizen portal, owners can easily reassign the violation details to the authorized driver without visiting a police station or court.",
    },
    {
      q: "Can I dispute an incorrect fine if I yielded to an emergency vehicle?",
      a: "Yes. Every notice includes a 1-click dispute mechanism. If you crossed a line to let an ambulance pass or were following the manual hand signals of a traffic officer, you can submit an appeal with a single click, which is audited and resolved within 48 hours.",
    },
    {
      q: "How is driver data and camera footage protected?",
      a: "Camera feeds are processed strictly for traffic safety compliance. Non-violation footage is automatically purged in accordance with municipal data privacy regulations, and personal driver records are protected with role-based access control.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#EFEFEF] text-[#171717] flex flex-col justify-between selection:bg-[#BAE2EF]">
      {/* 1. Header Navigation */}
      <header className="w-full border-b border-[#E5E5E5] bg-[#EFEFEF]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Navanagar Logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl object-contain bg-white border border-[#E5E5E5] shadow-xs"
              priority
            />
            <div>
              <span className="font-bold text-base tracking-tight text-[#171717]">
                Navanagar
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#6F7070]">
            <a href="#about" className="hover:text-[#171717] transition-colors">
              About
            </a>
            <a href="#how-it-works" className="hover:text-[#171717] transition-colors">
              How It Works
            </a>
            <a href="#capabilities" className="hover:text-[#171717] transition-colors">
              Capabilities
            </a>
            <a href="#fair-rules" className="hover:text-[#171717] transition-colors">
              Fair Rules
            </a>
            <a href="#faq" className="hover:text-[#171717] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Sign In & Sign Up Action Buttons (Shadcn UI) */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAuth("signin")}
              className="text-xs font-semibold"
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => openAuth("signup")}
              className="text-xs font-semibold shadow-soft"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Informational Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-10">
        
        {/* Top Hero Section: About Navanagar & Architecture Highlights */}
        <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column (7 cols): Platform Mission & Core Value */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-soft border border-[#E5E5E5]">
            <div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#171717] leading-[1.18]">
                Fair, transparent road safety for every driver.
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#6F7070] leading-relaxed">
                Navanagar is an intelligent urban traffic safety platform designed to replace arbitrary camera traps with total transparency. By pairing high-definition optical AI with mandatory human police verification, we protect honest drivers from unfair penalties while maintaining safe roads across the city.
              </p>

              {/* Action Buttons in Hero */}
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <Button
                  size="default"
                  onClick={() => openAuth("signin")}
                  className="font-semibold shadow-soft"
                >
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => openAuth("signup")}
                  className="font-semibold"
                >
                  Create New Account
                </Button>
              </div>
            </div>

            {/* Core Informational Guarantees */}
            <div className="mt-8 pt-6 border-t border-[#F0F0F0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#DCE9C5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#2D4C13]" strokeWidth={3} />
                </div>
                <div>
                  <strong className="text-[#171717] block font-semibold">100% Officer Verified</strong>
                  <span className="text-[#6F7070]">Zero automated penalties. Every notice is inspected and signed by a sworn traffic officer.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#BAE2EF] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#54A8BD]" strokeWidth={3} />
                </div>
                <div>
                  <strong className="text-[#171717] block font-semibold">HD Camera Evidence</strong>
                  <span className="text-[#6F7070]">Timestamped photo crops and intersection video recordings attached to every notice.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#F2B29A] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#5C2718]" strokeWidth={3} />
                </div>
                <div>
                  <strong className="text-[#171717] block font-semibold">Instant Multi-Channel Alerts</strong>
                  <span className="text-[#6F7070]">Notices delivered directly to the registered owner's phone via WhatsApp and SMS within 45 seconds.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#E5E5E5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#171717]" strokeWidth={3} />
                </div>
                <div>
                  <strong className="text-[#171717] block font-semibold">1-Click Transparent Appeal</strong>
                  <span className="text-[#6F7070]">Hassle-free online dispute mechanism for emergency yields or road anomalies.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Platform Architecture & System Roles */}
          <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
            
            {/* Architecture Card */}
            <Card className="flex-1 flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-[#F5F5F5]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider block">
                      System Overview
                    </span>
                    <CardTitle className="text-base mt-0.5">
                      Unified Safety Ecosystem
                    </CardTitle>
                  </div>
                  <Badge variant="blue">Multi-Tier</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-[#6F7070] leading-relaxed">
                  Navanagar connects citizens, field police personnel, and municipal planners through dedicated, role-tailored dashboards:
                </p>

                <div className="mt-4 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#F7F7F6] border border-[#EFEFEF] flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#BAE2EF] flex items-center justify-center text-[#54A8BD] shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#171717]">Citizen Portal</h4>
                      <p className="text-[11px] text-[#6F7070] mt-0.5 leading-snug">
                        Instant photo evidence access, safe driver scores, and online fine settlement without police station visits.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7F7F6] border border-[#EFEFEF] flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#DCE9C5] flex items-center justify-center text-[#2D4C13] shrink-0 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#171717]">Police Command Center</h4>
                      <p className="text-[11px] text-[#6F7070] mt-0.5 leading-snug">
                        3D city junction map, optical AI candidate reviews, certified officer verification queue, and incident monitoring.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7F7F6] border border-[#EFEFEF] flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#F2B29A] flex items-center justify-center text-[#5C2718] shrink-0 font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#171717]">City Administration</h4>
                      <p className="text-[11px] text-[#6F7070] mt-0.5 leading-snug">
                        Corridor speed parameter calibration, camera uptime monitoring, vehicle registry synchronization, and safety reporting.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Principle Badge Card */}
            <div className="bg-[#ffffff] text-black rounded-3xl p-5 shadow-soft flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#000000] tracking-wider block">
                  Core Philosophy
                </span>
                <h4 className="text-sm font-bold mt-0.5">
                  Fairness Over Revenue Collection
                </h4>
                <p className="text-xs text-black/70 mt-1">
                  Engineered to improve commute safety and eliminate predatory camera trap incentives.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-[#BAE2EF]" strokeWidth={2} />
              </div>
            </div>

          </div>

        </section>

        {/* 3. Three-Step Workflow: How It Works */}
        <section id="how-it-works" className="w-full pt-6 border-t border-[#E5E5E5]">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider bg-[#F7F7F6] px-2.5 py-1 rounded-full border border-[#E5E5E5]">
              Workflow Lifecycle
            </span>
            <h2 className="text-2xl font-bold text-[#171717] mt-2.5">
              How the System Works for You
            </h2>
            <p className="text-xs text-[#6F7070] mt-1.5">
              A transparent, three-stage lifecycle designed to eliminate surprise court summons and unfair penalties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#BAE2EF] flex items-center justify-center text-[#171717] mb-4">
                  <Camera className="w-4 h-4 text-[#54A8BD]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">Step 01</span>
                <h3 className="text-sm font-bold text-[#171717] mt-1 mb-1.5">
                  Silent Roadside Protection
                </h3>
                <p className="text-xs text-[#6F7070] leading-relaxed">
                  High-definition optical cameras continuously monitor designated intersections and corridors, detecting virtual stop line breaches, speeding, and safety compliance only during active red cycles.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F5F5F5] text-[11px] font-semibold text-[#54A8BD]">
                Accurate Optical AI &amp; ANPR
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#DCE9C5] flex items-center justify-center text-[#2D4C13] mb-4">
                  <Scale className="w-4 h-4 text-[#8CB64A]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">Step 02</span>
                <h3 className="text-sm font-bold text-[#171717] mt-1 mb-1.5">
                  Police Officer Oversight
                </h3>
                <p className="text-xs text-[#6F7070] leading-relaxed">
                  Every computer vision candidate is sent to a verification queue where a certified traffic officer inspects the frame. If context shows an ambulance passing or manual traffic directing, the event is immediately dismissed.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F5F5F5] text-[11px] font-semibold text-[#8CB64A]">
                Human In The Loop
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#F2B29A] flex items-center justify-center text-[#5C2718] mb-4">
                  <Smartphone className="w-4 h-4 text-[#E07A5F]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">Step 03</span>
                <h3 className="text-sm font-bold text-[#171717] mt-1 mb-1.5">
                  Instant Multi-Channel Notice
                </h3>
                <p className="text-xs text-[#6F7070] leading-relaxed">
                  Once verified, the vehicle owner receives a transparent WhatsApp and SMS message with an embedded video clip, violation breakdown, and secure payment link in under 45 seconds.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F5F5F5] text-[11px] font-semibold text-[#E07A5F]">
                Zero Bureaucratic Delay
              </div>
            </Card>
          </div>
        </section>

        {/* 4. Detailed Capabilities & Rules (Two Columns) */}
        <section id="capabilities" className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-[#E5E5E5]">
          
          {/* Left Column: Fair Rules for Drivers */}
          <div id="fair-rules" className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-[#E5E5E5]">
            <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider bg-[#F7F7F6] px-2.5 py-1 rounded-full border border-[#E5E5E5]">
              Driver Rights &amp; Fairness
            </span>
            <h3 className="text-lg font-bold text-[#171717] mt-2.5">
              Built to Protect Honest Motorists
            </h3>
            <p className="text-xs text-[#6F7070] mt-1 leading-relaxed">
              We engineered out the common flaws found in legacy automated red-light and speed cameras:
            </p>

            <div className="mt-5 space-y-3.5 text-xs text-[#6F7070]">
              <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB]">
                <strong className="text-[#171717] block mb-1">✓ Virtual Stop Line Buffer</strong>
                Drivers who safely decelerate slightly across the painted stop line without obstructing traffic or pedestrian crosswalks are never penalized.
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB]">
                <strong className="text-[#171717] block mb-1">✓ Corridor Point-to-Point Speed Averaging</strong>
                Speed is measured across a 2.5 km corridor (e.g. CCTV-01 ↔ CCTV-02). This eliminates hazardous emergency brake-slamming directly in front of camera poles.
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB]">
                <strong className="text-[#171717] block mb-1">✓ Emergency Vehicle Exemption</strong>
                Vehicles that maneuver into an intersection or cross a line to allow an ambulance or fire vehicle to pass are automatically exempted during officer review.
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB]">
                <strong className="text-[#171717] block mb-1">✓ Zero Surprise Penalties</strong>
                Immediate phone notifications prevent notices from compounding or accumulating late fees unnoticed for months.
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div id="faq" className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-[#E5E5E5]">
            <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider bg-[#F7F7F6] px-2.5 py-1 rounded-full border border-[#E5E5E5]">
              Clear Answers
            </span>
            <h3 className="text-lg font-bold text-[#171717] mt-2.5 mb-4">
              Frequently Asked Questions
            </h3>

            <div className="space-y-2.5">
              {faqItems.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="rounded-2xl border border-[#E5E5E5] bg-[#F7F7F6] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-[#171717]"
                    >
                      <span className="pr-2">{faq.q}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#6F7070] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-[#6F7070] leading-relaxed border-t border-[#EBEBEB] bg-white pt-2.5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </section>

      </main>

      {/* 5. Clean Full-Width Footer */}
      <footer className="w-full border-t border-[#E5E5E5] bg-white py-6 mt-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6F7070]">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Navanagar Logo"
              width={24}
              height={24}
              className="w-6 h-6 rounded-lg object-contain bg-white border border-[#E5E5E5]"
            />
            <span className="font-semibold text-[#171717]">Navanagar</span>
            <span>• Smart City Traffic &amp; Road Safety Platform</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => openAuth("signin")}
              className="text-[#6F7070] hover:text-[#171717] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth("signup")}
              className="text-[#6F7070] hover:text-[#171717] transition-colors"
            >
              Sign Up
            </button>
            <span className="text-[11px] text-[#999999]">
              &copy; 2026 Navanagar. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* Sign In & Sign Up Modal (Shadcn Dialog) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}
