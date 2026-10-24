"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  getStoredUser,
  getViolationsApi,
  payFineApi,
  ViolationItem,
  User,
} from "@/lib/api";
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  Video,
  Download,
  CheckCircle2,
  Car,
  Clock,
  Sparkles,
  Phone,
  Mail,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  X,
  ArrowRight,
  Bot
} from "lucide-react";

export default function CitizenViolationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [payingFineId, setPayingFineId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      fetchMyViolations(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMyViolations = async (userId: number) => {
    setLoading(true);
    try {
      const res = await getViolationsApi({ userId });
      if (res.success && res.violations) {
        setViolations(res.violations);
      }
    } catch (err) {
      console.error("Failed to load citizen violations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (fineId: number, violationId: number) => {
    setPayingFineId(fineId);
    try {
      const res = await payFineApi(fineId);
      if (res.success) {
        setSuccessMsg(
          `Payment of fine #${fineId} successful! Status has been updated to 'FINE ISSUED'. Official clearance receipt issued.`
        );
        setTimeout(() => setSuccessMsg(null), 6000);
        // Update local state: violationStatus becomes FINE_ISSUED and fine is PAID
        setViolations((prev) =>
          prev.map((v) =>
            v.fine?.id === fineId || v.id === violationId
              ? {
                  ...v,
                  violationStatus: "FINE_ISSUED",
                  fine: {
                    ...v.fine!,
                    status: "PAID",
                    paidAt: new Date().toISOString(),
                  },
                }
              : v
          )
        );
      }
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setPayingFineId(null);
    }
  };

  const pendingVerificationList = violations.filter(
    (v) => v.violationStatus === "PENDING_VERIFICATION"
  );
  const verifiedList = violations.filter(
    (v) => v.violationStatus === "VERIFIED"
  );
  const fineIssuedList = violations.filter(
    (v) => v.violationStatus === "FINE_ISSUED"
  );
  const totalVerifiedAmountDue = verifiedList.reduce(
    (acc, v) => acc + (v.fine?.amount || 0),
    0
  );

  const getViolationTypeClass = (type: string) => {
    switch (type) {
      case "NO_HELMET":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "WRONG_SIDE":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "OVERSPEED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RED_LIGHT":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderViolationStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            <span>PENDING-VERIFICATION</span>
          </span>
        );
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>VERIFIED (NANO BANANA)</span>
          </span>
        );
      case "FINE_ISSUED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>FINE ISSUED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout expectedRole="CITIZEN">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E5] shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] text-white text-xs font-semibold mb-3">
                <FileText className="w-3.5 h-3.5 text-[#BAE2EF]" />
                <span>CITIZEN TRAFFIC RECORD &amp; E-CHALLANS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                My Violations &amp; Fines
              </h1>
              <p className="text-xs sm:text-sm text-[#6F7070] mt-1.5 max-w-2xl leading-relaxed">
                Review automated traffic violations issued for your registered vehicles. Detections are independently audited by <strong>Google Nano Banana</strong>. Once verified, you can settle your fine online.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => currentUser && fetchMyViolations(currentUser.id)}
                disabled={loading}
                className="p-2.5 rounded-full border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#6F7070] hover:text-[#171717] transition-all"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mt-4 p-3.5 bg-green-50 border border-green-200 rounded-2xl text-green-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Citizen Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#F0F0F0]">
            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Pending AI Verification</span>
              </span>
              <span className="text-2xl font-extrabold text-amber-700 block mt-1">
                {pendingVerificationList.length}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                Under Nano Banana review
              </span>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Verified Fines Due</span>
              </span>
              <span className="text-2xl font-extrabold text-red-600 block mt-1">
                ₹{totalVerifiedAmountDue.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                {verifiedList.length} verified &amp; payable
              </span>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Fine Issued &amp; Settled</span>
              </span>
              <span className="text-2xl font-extrabold text-blue-700 block mt-1">
                {fineIssuedList.length}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                Payment completed
              </span>
            </div>
          </div>
        </div>

        {/* Violations List */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#171717]" />
              <span>Registered Violations ({violations.length})</span>
            </h2>
            <span className="text-xs text-[#6F7070]">
              Account: <strong className="text-[#171717]">{currentUser?.name}</strong> ({currentUser?.phone})
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#171717] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#6F7070]">Loading your traffic records...</p>
            </div>
          ) : violations.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">No Traffic Violations Found</h3>
              <p className="text-xs text-[#6F7070] max-w-sm mx-auto">
                Your registered vehicles have a clean record with zero pending fines. Keep driving safely!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {violations.map((v) => {
                const isPending = v.violationStatus === "PENDING_VERIFICATION";
                const isVerified = v.violationStatus === "VERIFIED";
                const isFineIssued = v.violationStatus === "FINE_ISSUED";

                return (
                  <div key={v.id} className="p-5 sm:p-6 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Plate + Violation Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#171717] text-white font-mono text-xs font-bold">
                            {v.vehicle.plateNumber}
                          </span>
                          <span className="text-xs text-[#6F7070] flex items-center gap-1 font-semibold">
                            <Car className="w-3.5 h-3.5" />
                            {v.vehicle.vehicleType}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getViolationTypeClass(
                              v.violationType
                            )}`}
                          >
                            {v.violationType.replace(/_/g, " ")}
                          </span>
                          {renderViolationStatusBadge(v.violationStatus)}
                        </div>

                        <div className="text-xs text-[#6F7070] space-y-0.5">
                          <p className="font-semibold text-[#171717]">{v.description}</p>
                          <p className="text-[11px] text-[#8C8C8C]">
                            Challan: <span className="font-mono font-bold text-[#171717]">{v.challanNumber}</span> &bull; Detected by <span className="font-mono">{v.camera.id}</span> ({v.camera.name}) on{" "}
                            {new Date(v.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {v.nanoAuditReason && (
                            <p className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block font-mono mt-1">
                              🤖 <strong>Nano Banana Audit:</strong> {v.nanoAuditReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Fine & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-[#8C8C8C] block">
                            Fine Amount
                          </span>
                          <span className="text-xl font-extrabold text-[#171717] block">
                            ₹{v.fine?.amount?.toLocaleString() || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Evidence Video Link/Modal */}
                          {v.evidence.videoUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedVideoUrl(v.evidence.videoUrl!)}
                              className="p-2 rounded-xl border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] flex items-center gap-1.5 text-xs font-semibold"
                              title="Watch Cloudflare R2 Video Footage"
                            >
                              <Video className="w-4 h-4 text-[#54A8BD]" />
                              <span className="hidden sm:inline">Proof Video</span>
                            </button>
                          )}

                          {/* E-Challan PDF */}
                          {v.fine?.pdfUrl && (
                            <a
                              href={v.fine.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] flex items-center gap-1.5 text-xs font-semibold"
                              title="Download Official Government E-Challan PDF"
                            >
                              <Download className="w-4 h-4 text-[#171717]" />
                              <span className="hidden sm:inline">PDF Challan</span>
                            </a>
                          )}

                          {/* 1. If PENDING_VERIFICATION: Payment locked */}
                          {isPending && (
                            <span
                              className="py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5"
                              title="Google Nano Banana AI Auditor is reviewing this detection. Payment unlocks when verified."
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              <span>AI Audit Pending</span>
                            </span>
                          )}

                          {/* 2. If VERIFIED: User role has button to pay fine! */}
                          {isVerified && v.fine && (
                            <button
                              type="button"
                              onClick={() => handlePayFine(v.fine!.id, v.id)}
                              disabled={payingFineId === v.fine.id}
                              className="py-2 px-4 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                            >
                              {payingFineId === v.fine.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#BAE2EF]" />
                                  <span>Issuing Fine...</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-3.5 h-3.5 text-[#BAE2EF]" />
                                  <span>Pay Fine ₹{v.fine.amount}</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* 3. If FINE_ISSUED: Fine is paid & issued */}
                          {isFineIssued && (
                            <span className="py-1.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Fine Issued &amp; Settled</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Player Modal */}
        {selectedVideoUrl && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#171717] text-white rounded-3xl max-w-2xl w-full p-6 border border-[#333] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#BAE2EF]" />
                  <h3 className="text-sm font-bold">Cloudflare R2 Traffic Violation Footage</h3>
                </div>
                <button
                  onClick={() => setSelectedVideoUrl(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-[#A0A0A0] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10">
                <video
                  src={selectedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                <span className="truncate max-w-md font-mono text-[10px]">{selectedVideoUrl}</span>
                <a
                  href={selectedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#BAE2EF] hover:underline text-xs"
                >
                  <span>Open in tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
