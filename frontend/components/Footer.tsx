"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck, Heart, ExternalLink } from "lucide-react";

interface FooterProps {
  onOpenChallanModal: () => void;
  onSelectRole: (role: "citizen" | "police" | "admin") => void;
}

export function Footer({ onOpenChallanModal, onSelectRole }: FooterProps) {
  return (
    <footer className="w-full mt-10 pt-8 pb-10 border-t border-[#E5E5E5] text-[#6F7070]">
      {/* Live System Status Ticker */}
      <div className="bg-white rounded-full py-2.5 px-4 sm:px-6 shadow-soft border border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3 text-xs mb-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8CB64A] animate-pulse" />
          <span className="font-semibold text-[#171717]">All City Safety Systems Operational</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CB64A]" />
            ANPR Detection: <strong>99.4%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CB64A]" />
            Speed Corridors: <strong>12 Active</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CB64A]" />
            WhatsApp Dispatch: <strong>&lt; 45s</strong>
          </span>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
        {/* Brand Column */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Navanagar Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-[#E5E5E5]"
            />
            <span className="text-[16px] font-bold text-[#171717]">Navanagar</span>
          </div>
          <p className="text-[#6F7070] leading-relaxed">
            Smart city traffic monitoring with verifiable photo evidence, instant WhatsApp alerts, and citizen-friendly 30-second fine resolution.
          </p>
        </div>

        {/* Citizen Services */}
        <div>
          <h4 className="font-bold text-[#171717] uppercase tracking-wider text-[11px] mb-3">
            For Citizens
          </h4>
          <ul className="space-y-2">
            <li>
              <button
                onClick={onOpenChallanModal}
                className="hover:text-[#171717] transition-colors"
              >
                Instant Challan Lookup
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectRole("citizen")}
                className="hover:text-[#171717] transition-colors"
              >
                Citizen Garage &amp; Vehicles
              </button>
            </li>
            <li>
              <button
                onClick={onOpenChallanModal}
                className="hover:text-[#171717] transition-colors"
              >
                View Photo &amp; Video Evidence
              </button>
            </li>
            <li>
              <span className="hover:text-[#171717] cursor-pointer">
                Dispute Resolution Process
              </span>
            </li>
          </ul>
        </div>

        {/* Authority & Police */}
        <div>
          <h4 className="font-bold text-[#171717] uppercase tracking-wider text-[11px] mb-3">
            Traffic Police &amp; Admin
          </h4>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => onSelectRole("police")}
                className="hover:text-[#171717] transition-colors"
              >
                3D Traffic Command Center
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectRole("police")}
                className="hover:text-[#171717] transition-colors"
              >
                Live CCTV AI Queue
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectRole("admin")}
                className="hover:text-[#171717] transition-colors"
              >
                Corridor &amp; Camera Management
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectRole("admin")}
                className="hover:text-[#171717] transition-colors"
              >
                Simulation &amp; Video Setup
              </button>
            </li>
          </ul>
        </div>

        {/* Safety & Compliance */}
        <div>
          <h4 className="font-bold text-[#171717] uppercase tracking-wider text-[11px] mb-3">
            Compliance &amp; Ethics
          </h4>
          <ul className="space-y-2">
            <li>
              <span className="hover:text-[#171717] cursor-pointer">
                Human-in-the-Loop Safeguards
              </span>
            </li>
            <li>
              <span className="hover:text-[#171717] cursor-pointer">
                Virtual Stop Line Standard
              </span>
            </li>
            <li>
              <span className="hover:text-[#171717] cursor-pointer">
                Citizen Privacy Charter
              </span>
            </li>
            <li>
              <span className="hover:text-[#171717] cursor-pointer">
                Open Data &amp; Safety Audit
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-6 border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#999999]">
        <p>
          &copy; 2026 Navanagar Platform • Designed for Cities of the Future.
        </p>
        <p className="flex items-center gap-1">
          <span>Promoting safer, fairer roads for all commuters.</span>
        </p>
      </div>
    </footer>
  );
}
