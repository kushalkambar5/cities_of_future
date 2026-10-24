"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I know the violation evidence is genuine?",
      a: "Every violation record includes high-resolution camera frames with your vehicle registration plate clearly visible, the precise timestamp, the CCTV camera identifier, and the calibrated speed or stop-line trigger. The underlying video recording is securely preserved with tamper-proof digital signatures.",
    },
    {
      q: "What if someone else was driving my car when the violation occurred?",
      a: "Notices are initially routed to the vehicle owner's registered WhatsApp and phone number. Through the Citizen Portal, owners can view full timestamped video evidence, assign the fine to the authorized driver, or submit the driver's details directly online without visiting a police precinct.",
    },
    {
      q: "How does the speed calculation between two CCTV cameras work?",
      a: "Our road-corridor module records when your vehicle passes Camera A (e.g., CCTV-01 at MG Road) and Camera B (CCTV-02 at Indiranagar, 2.5 km away). By dividing the 2.5 km distance by the elapsed travel time, the system determines your true average speed. This prevents hazardous last-second braking right before fixed speed cameras.",
    },
    {
      q: "How do I settle or pay a fine?",
      a: "You can click the secure link in your WhatsApp notice or use the 'Instant Challan Check' on this portal. After reviewing your photo evidence, you can settle the fine in 30 seconds via UPI, card, or net banking. Your receipt PDF is issued immediately and your vehicle record is updated to PAID.",
    },
    {
      q: "Can I dispute or contest a fine if I believe it was a mistake?",
      a: "Yes. Every notice has a '1-Click Dispute' option. You can upload relevant context (e.g., yielding to an emergency ambulance or following manual traffic officer signals). A supervisory officer reviews the footage within 48 hours, and fees are held pending review.",
    },
    {
      q: "How is my privacy protected?",
      a: "The system only scans public road intersections for traffic rule compliance. Personal owner details are never public and are strictly queried from the authorized vehicle registry to deliver legal safety notices to the verified owner.",
    },
  ];

  return (
    <section className="w-full my-12" aria-labelledby="faq-title">
      <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-soft border border-[#EBEBEB]">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-[11px] font-bold text-[#6F7070] uppercase tracking-wider bg-[#F7F7F6] px-3.5 py-1 rounded-full border border-[#E5E5E5]">
            Got Questions?
          </span>
          <h2 id="faq-title" className="text-2xl sm:text-3xl font-bold text-[#171717] mt-3 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-[14px] text-[#6F7070] mt-2">
            Everything you need to know about transparent traffic monitoring, evidence proof, and instant dispute resolution.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-[20px] bg-[#F7F7F6] border border-[#E5E5E5] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-[15px] text-[#171717] hover:text-[#54A8BD] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#E5E5E5] transition-transform duration-200 ${isOpen ? "rotate-180 bg-[#171717] text-white" : "text-[#6F7070]"}`}>
                    <ChevronDown className="w-4 h-4" strokeWidth={2} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-[13px] text-[#6F7070] leading-relaxed border-t border-[#EBEBEB] bg-white">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
