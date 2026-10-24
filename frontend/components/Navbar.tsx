"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, Bell, Shield, User, Sparkles, Check } from "lucide-react";

export type RoleType = "citizen" | "police" | "admin";

interface NavbarProps {
  currentRole: RoleType;
  onSelectRole: (role: RoleType) => void;
  onSearch: (query: string) => void;
  onOpenChallanModal: () => void;
}

export function Navbar({
  currentRole,
  onSelectRole,
  onSearch,
  onOpenChallanModal,
}: NavbarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Navanagar Logo"
            width={36}
            height={36}
            className="w-9 h-9 rounded-xl object-contain bg-white border border-[#E5E5E5] shadow-xs"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[17px] text-[#171717] tracking-tight">
                Navanagar
              </span>
            </div>
            <p className="text-[12px] text-[#6F7070]">
              Smart Traffic &amp; Transparent Safety
            </p>
          </div>
        </div>

        {/* Mobile Action trigger */}
        <button
          onClick={onOpenChallanModal}
          className="md:hidden text-xs bg-[#171717] text-white px-3 py-1.5 rounded-full font-medium"
        >
          Check Plate
        </button>
      </div>

      {/* Role Switcher Pill Bar (Crucial for showing how different users use it!) */}
      <div className="flex items-center bg-[#FFFFFF] p-1 rounded-full shadow-soft border border-[#E5E5E5] text-xs font-medium">
        <span className="text-[11px] text-[#999999] px-2.5 hidden sm:inline">Role Preview:</span>
        <button
          onClick={() => onSelectRole("citizen")}
          className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === "citizen"
              ? "bg-[#171717] text-white shadow-xs"
              : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
          }`}
          aria-pressed={currentRole === "citizen"}
        >
          Citizen &amp; Driver
        </button>
        <button
          onClick={() => onSelectRole("police")}
          className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === "police"
              ? "bg-[#171717] text-white shadow-xs"
              : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
          }`}
          aria-pressed={currentRole === "police"}
        >
          Traffic Police
        </button>
        <button
          onClick={() => onSelectRole("admin")}
          className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
            currentRole === "admin"
              ? "bg-[#171717] text-white shadow-xs"
              : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
          }`}
          aria-pressed={currentRole === "admin"}
        >
          City Admin
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Search Pill Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:flex-initial">
          <input
            type="text"
            placeholder="Search plate (e.g. KA01AB1234)..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full md:w-[220px] lg:w-[260px] h-[40px] pl-9 pr-4 rounded-full bg-white text-[12px] text-[#171717] placeholder-[#999999] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD] transition-all shadow-soft"
          />
          <Search className="w-3.5 h-3.5 text-[#999999] absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.8} />
        </form>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationPopup(!showNotificationPopup)}
            className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6] transition-colors relative shadow-soft"
            aria-label="View recent notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={1.8} />
            <span className="w-2 h-2 rounded-full bg-[#E07A5F] absolute top-2 right-2 ring-2 ring-white" />
          </button>

          {showNotificationPopup && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E5E5E5] p-3.5 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0F0F0]">
                <span className="font-semibold text-[#171717]">Recent Alert</span>
                <span className="text-[10px] text-[#999999]">Just now</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-[#F7F7F6] border border-[#EBEBEB]">
                  <p className="font-medium text-[#171717]">WhatsApp Fine Notice Dispatched</p>
                  <p className="text-[11px] text-[#6F7070] mt-0.5">
                    Vehicle KA01AB1234 received photo proof via WhatsApp (+91 98***).
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-[#DCE9C5]/50 border border-[#DCE9C5]">
                  <p className="font-medium text-[#2D4C13]">Safe Driver Index: 94.8%</p>
                  <p className="text-[11px] text-[#2D4C13]/80 mt-0.5">
                    Zero accidents reported across 12 monitored junctions today.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={onOpenChallanModal}
          className="hidden sm:inline-flex items-center gap-1.5 h-[40px] px-5 rounded-full bg-[#171717] hover:bg-[#333333] text-white text-[12px] font-medium transition-all shadow-soft active:scale-[0.98]"
        >
          <span>Instant Challan Check</span>
        </button>
      </div>
    </header>
  );
}
