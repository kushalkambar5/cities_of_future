"use client";

import React from "react";
import { 
  Home, 
  MapPin, 
  Car, 
  FileText, 
  BarChart3, 
  Bell, 
  ShieldCheck, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export function Sidebar({ activeSection, onSelectSection }: SidebarProps) {
  const navItems = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "command", icon: MapPin, label: "3D Command" },
    { id: "vehicles", icon: Car, label: "Vehicles" },
    { id: "violations", icon: FileText, label: "Challans" },
    { id: "analytics", icon: BarChart3, label: "Safety Pulse" },
    { id: "notifications", icon: Bell, label: "Alerts" },
  ];

  return (
    <aside 
      className="hidden lg:flex flex-col items-center justify-between w-[72px] bg-white rounded-[26px] py-6 px-3 shadow-soft border border-[#EBEBEB] select-none"
      aria-label="Main Navigation"
    >
      {/* Top Logo Badge */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => onSelectSection("overview")}
          className="w-11 h-11 rounded-full bg-[#171717] text-white flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
          title="Navanagar - Home"
          aria-label="Navanagar Home"
        >
          <ShieldCheck className="w-5 h-5 text-[#BAE2EF]" strokeWidth={2} />
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2" aria-label="Quick links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#54A8BD] ${
                  isActive
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-[#6F7070] hover:bg-[#F4F4F4] hover:text-[#171717]"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" strokeWidth={1.8} />
                
                {/* Tooltip on hover */}
                <span className="absolute left-[80px] bg-[#171717] text-white text-[11px] font-medium px-2.5 py-1 rounded-full opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => onSelectSection("settings")}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-[#6F7070] hover:bg-[#F4F4F4] hover:text-[#171717] transition-all focus:outline-none focus:ring-2 focus:ring-[#54A8BD] ${
            activeSection === "settings" ? "bg-[#171717] text-white" : ""
          }`}
          title="Settings & Config"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" strokeWidth={1.8} />
        </button>

        {/* Live System Indicator Dot */}
        <div 
          className="w-8 h-8 rounded-full bg-[#DCE9C5] flex items-center justify-center"
          title="All AI & Camera systems operating normally"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#8CB64A] animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
