"use client";

import React, { useState } from "react";
import { 
  X, 
  Search, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Eye, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Camera, 
  Share2 
} from "lucide-react";

interface VehicleChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlate?: string;
}

interface ViolationData {
  id: string;
  type: string;
  camera: string;
  location: string;
  speed?: string;
  speedLimit?: string;
  timestamp: string;
  confidence: string;
  amount: number;
  status: "UNPAID" | "PAID";
}

interface VehicleInfo {
  plate: string;
  owner: string;
  phone: string;
  type: string;
  model: string;
  safeScore: number;
  violations: ViolationData[];
}

const mockDatabase: Record<string, VehicleInfo> = {
  KA01AB1234: {
    plate: "KA01AB1234",
    owner: "Rahul Sharma",
    phone: "+91 98765 43210",
    type: "Car",
    model: "Honda City (White)",
    safeScore: 84,
    violations: [
      {
        id: "V1023",
        type: "Red Light Crossing & Speeding",
        camera: "CCTV-03",
        location: "MG Road Junction",
        speed: "87 km/h",
        speedLimit: "60 km/h",
        timestamp: "24 Oct 2026, 10:42:13 AM",
        confidence: "94.2%",
        amount: 1000,
        status: "UNPAID",
      },
      {
        id: "V1019",
        type: "Stop Line Infraction",
        camera: "CCTV-01",
        location: "MG Road South Approach",
        timestamp: "12 Oct 2026, 04:15:20 PM",
        confidence: "91.8%",
        amount: 500,
        status: "PAID",
      },
    ],
  },
  DL08CZ5678: {
    plate: "DL08CZ5678",
    owner: "Priya Patel",
    phone: "+91 98111 22334",
    type: "Car",
    model: "Hyundai Creta (Silver)",
    safeScore: 99,
    violations: [],
  },
  MH02EE9012: {
    plate: "MH02EE9012",
    owner: "Vikram Malhotra",
    phone: "+91 98222 33445",
    type: "Two-Wheeler",
    model: "Royal Enfield Hunter 350",
    safeScore: 91,
    violations: [
      {
        id: "V1025",
        type: "Missing Helmet Violation",
        camera: "CCTV-02",
        location: "Indiranagar 100ft Road",
        timestamp: "21 Oct 2026, 06:12:05 PM",
        confidence: "96.5%",
        amount: 500,
        status: "PAID",
      },
    ],
  },
};

export function VehicleChallanModal({
  isOpen,
  onClose,
  initialPlate = "KA01AB1234",
}: VehicleChallanModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialPlate);
  const [activePlate, setActivePlate] = useState(initialPlate);
  const [paymentStatus, setPaymentStatus] = useState<Record<string, "UNPAID" | "PAID">>({
    V1023: "UNPAID",
    V1019: "PAID",
    V1025: "PAID",
  });
  const [showEvidence, setShowEvidence] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentVehicle = mockDatabase[activePlate] || {
    plate: activePlate,
    owner: "Registered Citizen",
    phone: "+91 98XXX XXXXX",
    type: "Motor Vehicle",
    model: "Sedan / Hatchback",
    safeScore: 95,
    violations: [],
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean) {
      setActivePlate(clean);
    }
  };

  const handlePay = (violationId: string) => {
    setPaymentStatus((prev) => ({
      ...prev,
      [violationId]: "PAID",
    }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challan-modal-title"
    >
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#E5E5E5] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#BAE2EF] flex items-center justify-center text-[#171717]">
                <ShieldCheck className="w-5 h-5 text-[#54A8BD]" strokeWidth={2} />
              </div>
              <div>
                <h3 id="challan-modal-title" className="text-lg sm:text-xl font-bold text-[#171717]">
                  Instant Vehicle &amp; Challan Inspector
                </h3>
                <p className="text-xs text-[#6F7070]">
                  Official Smart City Vehicle Registry &amp; Verified Evidence
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#F7F7F6] hover:bg-[#EAEAEA] flex items-center justify-center text-[#6F7070] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-5">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                placeholder="Enter registration plate (e.g. KA01AB1234)..."
                className="w-full h-12 pl-11 pr-28 rounded-full bg-[#F7F7F6] text-sm font-semibold tracking-wider text-[#171717] placeholder-[#999999] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
              />
              <Search className="w-4 h-4 text-[#999999] absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2} />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-[#171717] text-white text-xs font-semibold hover:bg-[#333333] transition-all"
              >
                Search
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[11px] text-[#999999]">Try Sample Vehicles:</span>
              {Object.keys(mockDatabase).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSearchTerm(p);
                    setActivePlate(p);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    activePlate === p
                      ? "bg-[#171717] text-white border-[#171717]"
                      : "bg-[#F7F7F6] text-[#171717] border-[#E5E5E5] hover:bg-[#EBEBEB]"
                  }`}
                >
                  {p} {p === "DL08CZ5678" ? "(Clean)" : "(Has Notice)"}
                </button>
              ))}
            </div>
          </form>

          {/* Vehicle Information Banner */}
          <div className="mt-5 p-4 rounded-2xl bg-[#BAE2EF]/30 border border-[#BAE2EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wider text-[#171717]">
                  {currentVehicle.plate}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white font-medium text-[#6F7070] border border-[#E5E5E5]">
                  {currentVehicle.type}
                </span>
              </div>
              <p className="text-xs text-[#6F7070] mt-1">
                Owner: <strong>{currentVehicle.owner}</strong> • {currentVehicle.model}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-[#6F7070] uppercase font-bold block">
                  Safe Driver Score
                </span>
                <span className="text-base font-extrabold text-[#2D4C13]">
                  {currentVehicle.safeScore}/100
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#DCE9C5] flex items-center justify-center text-[#2D4C13]">
                <ShieldCheck className="w-5 h-5 text-[#8CB64A]" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Violations List */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-[#6F7070] uppercase tracking-wider mb-3">
              Recorded Notices &amp; Safety Events
            </h4>

            {currentVehicle.violations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#DCE9C5]/30 border border-[#DCE9C5] text-center">
                <CheckCircle2 className="w-10 h-10 text-[#8CB64A] mx-auto mb-2" strokeWidth={2} />
                <h5 className="text-base font-bold text-[#2D4C13]">Zero Outstanding Violations</h5>
                <p className="text-xs text-[#2D4C13]/80 mt-1 max-w-sm mx-auto">
                  This vehicle has a spotless driving record. No red light, speeding, or helmet infractions recorded across city cameras.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentVehicle.violations.map((v) => {
                  const currentStatus = paymentStatus[v.id] || v.status;
                  const isPaid = currentStatus === "PAID";

                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] hover:border-[#D0D0D0] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EBEBEB]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#171717]">{v.id}</span>
                            <span className="text-xs font-medium text-[#171717]">{v.type}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#6F7070] mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {v.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Camera className="w-3 h-3" /> {v.camera}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:text-right">
                          <span className="text-base font-extrabold text-[#171717]">
                            ₹{v.amount}
                          </span>
                          {isPaid ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCE9C5] text-[#2D4C13] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#8CB64A]" /> PAID
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F2B29A] text-[#5C2718]">
                              UNPAID
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#6F7070]">
                          <span>Time: {v.timestamp}</span> •{" "}
                          <span className="text-[#54A8BD] font-medium">AI Conf: {v.confidence}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEvidence(showEvidence === v.id ? null : v.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E5E5] bg-white text-[#171717] font-medium hover:bg-[#F0F0F0]"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#54A8BD]" strokeWidth={1.8} />
                            <span>{showEvidence === v.id ? "Hide Proof" : "View Photo Proof"}</span>
                          </button>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => handlePay(v.id)}
                              className="px-4 py-1.5 rounded-full bg-[#171717] text-white font-semibold hover:bg-[#333333] transition-all shadow-xs"
                            >
                              Pay Now (Simulate)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Evidence Photo Snapshot Expandable */}
                      {showEvidence === v.id && (
                        <div className="mt-3 pt-3 border-t border-[#EBEBEB] text-xs">
                          <div className="p-3 rounded-xl bg-white border border-[#E0E0E0] space-y-2">
                            <div className="flex justify-between font-medium text-[#171717]">
                              <span>High-Resolution Camera Frame</span>
                              <span className="font-mono text-[#6F7070]">{v.camera} / 1080p</span>
                            </div>
                            <div className="h-32 bg-[#C6D6DA]/60 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-dashed border-[#54A8BD]">
                              <Camera className="w-6 h-6 text-[#54A8BD] mb-1" />
                              <span className="font-mono font-bold text-[#171717]">
                                Plate: {currentVehicle.plate} • Stop Line Crossed
                              </span>
                              <span className="text-[11px] text-[#6F7070] mt-0.5">
                                Speed: {v.speed || "N/A"} • Timestamp: {v.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6F7070] text-center">
                              Original raw video archived to cloud storage with tamper-proof SHA256 checksum.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#F0F0F0] flex items-center justify-between text-xs text-[#999999]">
          <span>Smart Traffic &amp; Road Safety Portal</span>
          <button
            onClick={onClose}
            className="text-[#171717] font-semibold hover:underline"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
