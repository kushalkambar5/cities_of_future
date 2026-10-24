"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Car, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Send, 
  FileCheck, 
  Eye, 
  Zap, 
  ExternalLink,
  RotateCcw
} from "lucide-react";

interface HeroDashboardProps {
  onSearchPlate: (plate: string) => void;
  activeRole: "citizen" | "police" | "admin";
}

export function HeroDashboard({ onSearchPlate, activeRole }: HeroDashboardProps) {
  // State for interactive features
  const [testPlate, setTestPlate] = useState("KA01AB1234");
  const [finePaid, setFinePaid] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [policeVerified, setPoliceVerified] = useState<boolean | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(true);

  const handleTestPlateSelect = (plate: string) => {
    setTestPlate(plate);
    setFinePaid(false);
    setPoliceVerified(null);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Top Grid: Hero (Left) + Urban Safety Pulse (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Hero Card - Soft Pastel Blue (var(--blue-100) #BAE2EF) */}
        <div className="lg:col-span-8 bg-[#BAE2EF] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-soft border border-[#A7D7E7]">
          {/* Subtle Decorative Background Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/25 rounded-full blur-2xl pointer-events-none" />

          {/* Top Badge & Role Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#171717] text-[11px] font-semibold tracking-wide shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#54A8BD]" strokeWidth={2} />
              SAFE CITY PLATFORM
            </span>

            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#171717]/80 bg-white/40 px-2.5 py-1 rounded-full">
              <span>Viewing as:</span>
              <strong className="capitalize text-[#171717]">{activeRole}</strong>
            </div>
          </div>

          {/* Hero Content */}
          <div className="my-6 z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#171717] tracking-tight leading-[1.2]">
              Smarter City Roads. <br />
              <span className="font-semibold text-[#171717]/90">
                Fair, Transparent &amp; Instant for Citizens.
              </span>
            </h1>
            <p className="mt-3 text-[13px] sm:text-[14px] text-[#171717]/80 leading-relaxed max-w-lg">
              No hidden speed traps or surprise notices. When traffic safety events occur, AI assists police with verified photo/video proof, citizens get instant WhatsApp alerts, and fines resolve online in 30 seconds.
            </p>
          </div>

          {/* Interactive Plate Quick Check Bar */}
          <div className="z-10 bg-white/90 backdrop-blur-md rounded-[20px] p-3 sm:p-4 shadow-sm border border-white/60">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-[#6F7070] uppercase tracking-wider block mb-1">
                  Try Vehicle Lookup (Live Simulation)
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-[#EFEFEF] border border-[#E0E0E0] text-[12px] font-bold tracking-wider text-[#171717]">
                    IND
                  </div>
                  <input
                    type="text"
                    value={testPlate}
                    onChange={(e) => setTestPlate(e.target.value.toUpperCase())}
                    className="flex-1 bg-transparent text-[14px] font-bold text-[#171717] tracking-wider focus:outline-none uppercase"
                    placeholder="KA01AB1234"
                  />
                </div>
              </div>

              {/* Sample Plate Quick Select Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#6F7070] mr-1 hidden md:inline">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => handleTestPlateSelect("KA01AB1234")}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    testPlate === "KA01AB1234"
                      ? "bg-[#171717] text-white border-[#171717]"
                      : "bg-white text-[#171717] border-[#E0E0E0] hover:bg-[#F7F7F6]"
                  }`}
                >
                  KA01AB1234 (Violation)
                </button>
                <button
                  type="button"
                  onClick={() => handleTestPlateSelect("DL08CZ5678")}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    testPlate === "DL08CZ5678"
                      ? "bg-[#171717] text-white border-[#171717]"
                      : "bg-white text-[#171717] border-[#E0E0E0] hover:bg-[#F7F7F6]"
                  }`}
                >
                  DL08CZ5678 (Clean)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Pulse Card - White Surface (#FFFFFF) with Circular Progress */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-6 sm:p-7 flex flex-col justify-between shadow-soft border border-[#EBEBEB]">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6F7070] uppercase tracking-wider block">
                Today's Overview
              </span>
              <h2 className="text-[17px] font-bold text-[#171717] mt-0.5">
                Urban Safety Pulse
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCE9C5] text-[#2D4C13] text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8CB64A] animate-pulse" />
              12 Active Nodes
            </span>
          </div>

          {/* Metric with Circular Progress Ring */}
          <div className="my-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[34px] font-extrabold text-[#171717] tracking-tight leading-none">
                94.8%
              </div>
              <p className="text-[12px] text-[#6F7070] mt-1.5">
                Safe Commute Compliance
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#2D4C13] bg-[#DCE9C5]/60 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3 text-[#8CB64A]" strokeWidth={2.5} />
                <span>+4.2% vs previous week</span>
              </div>
            </div>

            {/* SVG Circular Progress Meter (Green-500 #8CB64A) */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#E8E8E8"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#8CB64A"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="13"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <ShieldCheck className="w-6 h-6 text-[#8CB64A]" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Micro Statistics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F2F2F2]">
            <div className="p-2.5 rounded-2xl bg-[#F7F7F6]">
              <span className="text-[10px] text-[#999999] font-medium block">Monitored Today</span>
              <span className="text-[14px] font-bold text-[#171717]">18,420 cars</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#F7F7F6]">
              <span className="text-[10px] text-[#999999] font-medium block">Avg WhatsApp Alert</span>
              <span className="text-[14px] font-bold text-[#171717]">42 seconds</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom 3 Cards (Exercise, Analytics, Workload layout from design.md) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Card 1: Citizen View - Instant Vehicle & Challan Status */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-soft border border-[#EBEBEB] flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#BAE2EF] flex items-center justify-center text-[#171717]">
                  <Car className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#171717]">Citizen Garage &amp; Notice</h3>
                  <p className="text-[11px] text-[#6F7070]">Vehicle status &amp; proof</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F7F7F6] text-[#6F7070] border border-[#E5E5E5]">
                {testPlate}
              </span>
            </div>

            {/* Vehicle Detail Preview */}
            {testPlate === "DL08CZ5678" ? (
              <div className="mt-4 p-4 rounded-2xl bg-[#DCE9C5]/40 border border-[#DCE9C5] text-center">
                <CheckCircle2 className="w-8 h-8 text-[#8CB64A] mx-auto mb-2" strokeWidth={2} />
                <h4 className="text-[14px] font-bold text-[#2D4C13]">Clean Driving Record</h4>
                <p className="text-[11px] text-[#2D4C13]/80 mt-1">
                  Owner: Priya Patel (Hyundai Creta) <br />
                  0 Active Violations • 99/100 Safe Driver Score
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-bold text-[#171717]">Notice #V1023</span>
                      <p className="text-[11px] text-[#6F7070]">MG Road Junction • 10:42 AM</p>
                    </div>
                    <span className="text-[13px] font-bold text-[#171717]">₹1,000</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F2B29A] text-[#5C2718]">
                      Red Light + Speeding
                    </span>
                    <span className="text-[11px] text-[#6F7070]">87 km/h (Limit: 60)</span>
                  </div>
                </div>

                {/* Simulated Payment / Resolution Flow */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setShowEvidenceModal(!showEvidenceModal)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#54A8BD] hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>{showEvidenceModal ? "Hide Evidence" : "View Photo Proof"}</span>
                  </button>

                  {finePaid ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCE9C5] text-[#2D4C13] text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-[#8CB64A]" strokeWidth={2.5} />
                      PAID / RESOLVED
                    </span>
                  ) : (
                    <button
                      onClick={() => setFinePaid(true)}
                      className="px-3.5 py-1.5 rounded-full bg-[#171717] hover:bg-[#333333] text-white text-[11px] font-semibold transition-all shadow-2xs active:scale-95"
                    >
                      Clear Fine (Simulate)
                    </button>
                  )}
                </div>

                {/* Evidence Drawer */}
                {showEvidenceModal && (
                  <div className="p-3 rounded-xl bg-[#EFEFEF] text-[11px] text-[#171717] space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between font-medium">
                      <span>Camera: CCTV-03</span>
                      <span>Confidence: 94.2%</span>
                    </div>
                    <div className="w-full h-20 rounded-lg bg-[#C6D6DA] flex items-center justify-center text-[#171717]/60 text-[10px] font-mono border border-dashed border-[#54A8BD]">
                      [ High-Res Frame: Stop line crossed at 10:42:13 ]
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F2F2] flex items-center justify-between text-[11px] text-[#6F7070]">
            <span>Rahul Sharma (Honda City)</span>
            <span className="text-[#8CB64A] font-medium">Registered Driver</span>
          </div>
        </div>

        {/* Card 2: Police 3D Center - Live CCTV AI Detection */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-soft border border-[#EBEBEB] flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#DCE9C5] flex items-center justify-center text-[#2D4C13]">
                  <Camera className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#171717]">Police Junction Watch</h3>
                  <p className="text-[11px] text-[#6F7070]">CCTV-03 MG Road Junction</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DCE9C5] text-[#2D4C13]">
                ● Live AI Feed
              </span>
            </div>

            {/* Live Camera Feed Simulation */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#171717] text-white">
              <div className="flex items-center justify-between text-[11px] text-white/70 pb-2 border-b border-white/10">
                <span className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  REC: CCTV-03
                </span>
                <span className="text-[10px] font-semibold bg-red-600/80 px-2 py-0.5 rounded-full">
                  TRAFFIC LIGHT: RED
                </span>
              </div>

              <div className="my-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/60">Detected Vehicle</div>
                  <div className="text-[15px] font-extrabold tracking-wider text-white">
                    {testPlate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/60">Speed Radar</div>
                  <div className="text-[15px] font-extrabold text-[#F2B29A]">
                    87 km/h <span className="text-[10px] font-normal text-white/60">/ 60</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/80 pt-1">
                <span>Stop Line Violation</span>
                <span className="text-[#BAE2EF]">AI Conf: 94%</span>
              </div>
            </div>

            {/* Police Officer Verification Action */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setPoliceVerified(true)}
                disabled={policeVerified === true}
                className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  policeVerified === true
                    ? "bg-[#DCE9C5] text-[#2D4C13]"
                    : "bg-[#171717] text-white hover:bg-[#333333]"
                }`}
              >
                {policeVerified === true ? "✓ Verified & Fine Issued" : "Verify as Officer"}
              </button>
              <button
                onClick={() => setPoliceVerified(false)}
                className="px-3 py-1.5 rounded-full bg-[#F7F7F6] text-[#6F7070] text-[11px] font-medium hover:bg-[#EBEBEB]"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F2F2] flex items-center justify-between text-[11px] text-[#6F7070]">
            <span>Human Officer In The Loop</span>
            <span className="text-[#171717] font-medium">Zero False Penalties</span>
          </div>
        </div>

        {/* Card 3: Urban Corridors - Speed Segment & WhatsApp Alert */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-soft border border-[#EBEBEB] flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F2B29A] flex items-center justify-center text-[#5C2718]">
                  <Zap className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#171717]">Corridor Speed &amp; Alert</h3>
                  <p className="text-[11px] text-[#6F7070]">CCTV-01 ↔ CCTV-02 (2.5 km)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#BAE2EF] text-[#171717]">
                Smart Match
              </span>
            </div>

            {/* Segment Speed Calculation Breakdown */}
            <div className="mt-4 p-3 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6F7070]">Distance: 2.5 km</span>
                <span className="text-[#6F7070]">Time: 90 sec</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#171717]">Avg Segment Speed:</span>
                <span className="text-[14px] font-extrabold text-[#E07A5F]">100 km/h</span>
              </div>
              <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#E07A5F] h-full w-[80%] rounded-full" />
              </div>
            </div>

            {/* WhatsApp Notification Dispatch Simulation */}
            <div className="mt-3 p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px]">
                    💬
                  </div>
                  <span className="text-[11px] font-bold text-[#171717]">WhatsApp Dispatch</span>
                </div>
                <span className="text-[10px] text-[#25D366] font-semibold">Delivered</span>
              </div>
              <p className="text-[11px] text-[#171717]/80 mt-1.5 leading-snug">
                &ldquo;Notice: {testPlate} recorded overspeeding. Tap to review photo proof &amp; settle fine.&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F2F2] flex items-center justify-between text-[11px] text-[#6F7070]">
            <span>Automated WhatsApp Gateway</span>
            <span className="text-[#25D366] font-semibold">No Postal Delays</span>
          </div>
        </div>

      </div>
    </div>
  );
}
