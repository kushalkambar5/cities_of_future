"use client";

import React, { useState } from "react";
import { 
  Camera, 
  Cpu, 
  UserCheck, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Zap, 
  Play, 
  RotateCcw 
} from "lucide-react";

export function LiveWorkflowDemo() {
  const [activeStep, setActiveStep] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Junction Event",
      subtitle: "Silent Roadside Monitoring",
      icon: Camera,
      tag: "CCTV-03 MG Road",
      color: "bg-[#BAE2EF]",
      textColor: "text-[#171717]",
      description:
        "A car approaches the intersection. The traffic signal turns red. The camera records vehicle KA01AB1234 crossing the virtual stop line at 87 km/h.",
      highlight: "Virtual Stop Line + Speed Radar",
      metrics: [
        { label: "Location", value: "MG Road Junction" },
        { label: "Signal Status", value: "RED LIGHT" },
        { label: "Captured Speed", value: "87 km/h (Limit: 60)" },
      ],
    },
    {
      id: 2,
      title: "AI Analysis",
      subtitle: "High-Confidence Event Filtering",
      icon: Cpu,
      tag: "FastAPI ML Pipeline",
      color: "bg-[#DCE9C5]",
      textColor: "text-[#2D4C13]",
      description:
        "Specialized models recognize the license plate (KA01AB1234), confirm helmet/seatbelt compliance, and package the violation frame with 94.2% AI confidence.",
      highlight: "ANPR + Rule Engine Verification",
      metrics: [
        { label: "Plate Read", value: "KA01AB1234" },
        { label: "Model Confidence", value: "94.2%" },
        { label: "Rule Matched", value: "Stop-Line & Overspeed" },
      ],
    },
    {
      id: 3,
      title: "Police Oversight",
      subtitle: "Human Officer in the Loop",
      icon: UserCheck,
      tag: "Command Hub Terminal",
      color: "bg-white",
      textColor: "text-[#171717]",
      description:
        "The flagged incident appears on the officer's command screen with crystal-clear photo proof. The officer verifies the incident with a single tap to eliminate false penalties.",
      highlight: "Prevents Erroneous Fines",
      metrics: [
        { label: "Review Officer", value: "Badge #4208" },
        { label: "Action Taken", value: "APPROVED / VERIFIED" },
        { label: "Fine Assessed", value: "₹1,000" },
      ],
    },
    {
      id: 4,
      title: "WhatsApp Dispatch",
      subtitle: "Transparent Notice in 40 Seconds",
      icon: Smartphone,
      tag: "WhatsApp Gateway",
      color: "bg-[#F2B29A]",
      textColor: "text-[#5C2718]",
      description:
        "Vehicle database finds owner Rahul Sharma. An official WhatsApp message is dispatched immediately with full photo proof, violation details, and zero delay.",
      highlight: "No Hidden Tickets or Court Woes",
      metrics: [
        { label: "Recipient", value: "Rahul Sharma (+91 98***)" },
        { label: "Delivery Time", value: "< 45 Seconds" },
        { label: "Attachment", value: "Official Penalty PDF" },
      ],
    },
    {
      id: 5,
      title: "Citizen Resolution",
      subtitle: "1-Tap Settle or Contest",
      icon: CheckCircle2,
      tag: "Citizen Portal",
      color: "bg-[#DCE9C5]",
      textColor: "text-[#2D4C13]",
      description:
        "The driver taps the link, reviews the exact CCTV evidence, and marks the payment done. The violation status instantly updates from UNPAID to PAID.",
      highlight: "Transparent & Fast Resolution",
      metrics: [
        { label: "Payment Status", value: "PAID / CLEARED" },
        { label: "Dispute Option", value: "1-Click Contest" },
        { label: "Safe Driver Score", value: "Updated Live" },
      ],
    },
  ];

  const currentStep = steps[activeStep - 1];

  return (
    <section className="w-full my-12" aria-labelledby="workflow-title">
      <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-soft border border-[#EBEBEB]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#F0F0F0]">
          <div>
            <span className="text-[11px] font-bold text-[#6F7070] uppercase tracking-wider bg-[#F7F7F6] px-3 py-1 rounded-full border border-[#E5E5E5]">
              Interactive Simulation
            </span>
            <h2 id="workflow-title" className="text-2xl sm:text-3xl font-bold text-[#171717] mt-2 tracking-tight">
              How an Incident Travels from Road to Resolution
            </h2>
            <p className="text-[13px] text-[#6F7070] mt-1 max-w-xl">
              Follow a single traffic event to see how AI speed checks, officer verification, and instant WhatsApp delivery work together seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep((prev) => (prev % 5) + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#171717] text-white text-[12px] font-medium hover:bg-[#333333] transition-all"
            >
              <span>Next Step ({activeStep}/5)</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              onClick={() => setActiveStep(1)}
              className="p-2 rounded-full border border-[#E5E5E5] text-[#6F7070] hover:bg-[#F7F7F6]"
              title="Reset simulation to step 1"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Stepper Pill Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-6">
          {steps.map((s) => {
            const isCurrent = s.id === activeStep;
            const isCompleted = s.id < activeStep;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`p-3 rounded-2xl text-left transition-all ${
                  isCurrent
                    ? "bg-[#171717] text-white shadow-sm"
                    : isCompleted
                    ? "bg-[#F7F7F6] text-[#171717] hover:bg-[#EFEFEF]"
                    : "bg-white border border-[#EBEBEB] text-[#6F7070] hover:bg-[#F7F7F6]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isCurrent ? "text-[#BAE2EF]" : "text-[#999999]"}`}>
                    0{s.id}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#8CB64A]" strokeWidth={2.5} />}
                </div>
                <div className="text-[12px] font-bold truncate">{s.title}</div>
                <div className={`text-[10px] truncate ${isCurrent ? "text-white/70" : "text-[#999999]"}`}>
                  {s.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Detail Card */}
        <div className="bg-[#F7F7F6] rounded-[24px] p-6 sm:p-8 border border-[#E5E5E5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Description */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#BAE2EF] text-[#171717]">
                {currentStep.tag}
              </span>
              <span className="text-[11px] font-medium text-[#6F7070]">
                {currentStep.highlight}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">
              {currentStep.id}. {currentStep.title} — {currentStep.subtitle}
            </h3>

            <p className="text-[14px] text-[#6F7070] mt-3 leading-relaxed">
              {currentStep.description}
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentStep.metrics.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-[#EAEAEA]">
                  <span className="text-[10px] text-[#999999] font-medium block">{m.label}</span>
                  <span className="text-[12px] font-bold text-[#171717] mt-0.5 block truncate">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Simulation Box */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E5E5E5] shadow-xs">
            {activeStep === 1 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Junction Camera Feed</span>
                  <span className="text-red-500 font-mono text-[10px]">● RECORDING</span>
                </div>
                <div className="h-32 bg-[#171717] rounded-xl flex flex-col items-center justify-center text-white p-3 text-center">
                  <Camera className="w-6 h-6 text-[#BAE2EF] mb-2" strokeWidth={1.8} />
                  <p className="text-[12px] font-mono">CCTV-03: MG ROAD</p>
                  <span className="text-[10px] text-[#F2B29A] mt-1 font-bold">
                    Vehicle crossed Virtual Stop Line @ 87 km/h
                  </span>
                </div>
                <p className="text-[11px] text-[#6F7070] text-center">
                  Stop line triggers automatically on signal RED state
                </p>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>AI Detection Pipeline</span>
                  <span className="text-[#8CB64A] text-[10px] font-semibold">INFERENCE &lt; 80ms</span>
                </div>
                <div className="p-3 rounded-xl bg-[#EFEFEF] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6F7070]">ANPR Plate:</span>
                    <span className="font-mono font-bold text-[#171717]">KA01AB1234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6F7070]">Speed Limit Check:</span>
                    <span className="text-red-600 font-bold">87 km/h &gt; 60 km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6F7070]">Confidence:</span>
                    <span className="text-[#2D4C13] font-semibold">94.2%</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#6F7070] text-center">
                  Converted into standardized Detection Event
                </p>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Officer Verification</span>
                  <span className="bg-[#BAE2EF] text-[#171717] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    ACTIVE SCREEN
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F7F6] border border-[#E5E5E5] text-xs space-y-2">
                  <p className="text-[11px] text-[#171717]">
                    &ldquo;Evidence image confirms vehicle KA01AB1234 beyond stop line while signal red.&rdquo;
                  </p>
                  <div className="flex gap-2 pt-1">
                    <span className="flex-1 py-1 rounded-lg bg-[#171717] text-white text-center font-bold text-[11px]">
                      Verified (Issued)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#6F7070] text-center">
                  Human verification ensures zero false notices
                </p>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>WhatsApp Message Delivered</span>
                  <span className="text-[#25D366] text-[10px] font-bold">✓✓ Read</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-xs">
                  <p className="font-bold text-[#171717] mb-1">🚨 Smart Traffic Notice</p>
                  <p className="text-[11px] text-[#171717]/80">
                    Vehicle: <strong>KA01AB1234</strong> <br />
                    Violation: Overspeeding (87 km/h) <br />
                    Fine: ₹1,000 <br />
                    Tap to review video proof &amp; receipt PDF.
                  </p>
                </div>
                <p className="text-[11px] text-[#6F7070] text-center">
                  Citizen receives notice within 45 seconds of incident
                </p>
              </div>
            )}

            {activeStep === 5 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Instant Citizen Portal</span>
                  <span className="text-[#8CB64A] text-[10px] font-bold">SETTLED</span>
                </div>
                <div className="p-4 rounded-xl bg-[#DCE9C5]/50 border border-[#8CB64A]/30 text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#8CB64A] mx-auto mb-1.5" strokeWidth={2} />
                  <span className="text-[13px] font-bold text-[#2D4C13]">Challan #V1023 Cleared</span>
                  <p className="text-[11px] text-[#2D4C13]/80 mt-1">
                    Receipt #REC-8921 generated • Safe Driver score preserved
                  </p>
                </div>
                <p className="text-[11px] text-[#6F7070] text-center">
                  No police station visit, no hassle, completely transparent
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
