"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  getStoredUser,
  getViolationsApi,
  payFineApi,
  ViolationItem,
  User as UserType,
} from "@/lib/api";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  ArrowRight,
  FileText,
  AlertTriangle,
  Car,
  Download,
  Video,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink
} from "lucide-react";

export default function CitizenDashboardPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [payingFineId, setPayingFineId] = useState<number | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      fetchViolations(stored.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchViolations = async (userId: number) => {
    setLoading(true);
    try {
      const res = await getViolationsApi({ userId });
      if (res.success && res.violations) {
        setViolations(res.violations);
      }
    } catch (err) {
      console.error("Failed to fetch citizen violations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (fineId: number, violationId?: number) => {
    setPayingFineId(fineId);
    try {
      const res = await payFineApi(fineId);
      if (res.success) {
        setPaymentSuccessMsg(`Payment of fine #${fineId} successful! Status updated to 'FINE ISSUED'.`);
        setTimeout(() => setPaymentSuccessMsg(null), 5000);
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

  const unpaidFines = violations.filter((v) => v.fine?.status === "UNPAID");
  const totalDue = unpaidFines.reduce((acc, v) => acc + (v.fine?.amount || 0), 0);

  return (
    <DashboardLayout expectedRole="CITIZEN">
      <div className="space-y-6 max-w-4xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              Citizen Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
              Welcome back, {user?.name || "Citizen"} 👋
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/citizen/violations" className="flex items-center gap-1.5 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" />
                <span>My Violations &amp; Fines ({violations.length})</span>
              </Link>
            </Button>
            <Badge variant="green" className="py-1 px-3 text-xs">
              CITIZEN
            </Badge>
          </div>
        </div>

        {paymentSuccessMsg && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{paymentSuccessMsg}</span>
          </div>
        )}

        {/* Violations & Fines Highlight Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E5E5] shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                unpaidFines.length > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}>
                {unpaidFines.length > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#171717]">
                  {unpaidFines.length > 0 ? "Pending Traffic Penalties" : "Clean Traffic Record"}
                </h2>
                <p className="text-xs text-[#6F7070]">
                  {unpaidFines.length > 0
                    ? `You have ${unpaidFines.length} pending E-Challan(s) requiring settlement.`
                    : "No pending violations detected for your registered vehicles."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">
                  Total Outstanding
                </span>
                <span className={`text-2xl font-extrabold ${unpaidFines.length > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₹{totalDue.toLocaleString()}
                </span>
              </div>
              <Button asChild className="bg-[#171717] hover:bg-black text-white rounded-full text-xs font-bold">
                <Link href="/citizen/violations">View All ({violations.length})</Link>
              </Button>
            </div>
          </div>

          {/* List of Recent Violations */}
          {loading ? (
            <div className="p-8 text-center text-xs text-[#6F7070]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#171717]" />
              Loading your violation records...
            </div>
          ) : violations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6F7070]">
              Zero traffic violations recorded. Drive safely and obey city traffic signals!
            </div>
          ) : (
            <div className="divide-y divide-[#F5F5F5] mt-2">
              {violations.slice(0, 3).map((v) => {
                const isPending = v.violationStatus === "PENDING_VERIFICATION";
                const isVerified = v.violationStatus === "VERIFIED";
                const isFineIssued = v.violationStatus === "FINE_ISSUED";

                return (
                  <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#171717] text-white text-[11px]">
                          {v.vehicle.plateNumber}
                        </span>
                        <span className="font-bold text-[#171717]">{v.violationType.replace(/_/g, " ")}</span>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            PENDING-VERIFICATION
                          </span>
                        )}
                        {isVerified && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            VERIFIED (NANO BANANA)
                          </span>
                        )}
                        {isFineIssued && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            FINE ISSUED
                          </span>
                        )}
                      </div>
                      <p className="text-[#6F7070] text-[11px]">
                        Challan {v.challanNumber} &bull; Sensor {v.camera.id} &bull; {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#171717] mr-1">
                        ₹{v.fine?.amount || 0}
                      </span>

                      {v.evidence.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedVideoUrl(v.evidence.videoUrl!)}
                          className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717]"
                          title="Watch Evidence Video"
                        >
                          <Video className="w-3.5 h-3.5 text-[#54A8BD]" />
                        </button>
                      )}

                      {v.fine?.pdfUrl && (
                        <a
                          href={v.fine.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717]"
                          title="Download E-Challan PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-[#171717]" />
                        </a>
                      )}

                      {/* Payment states */}
                      {isPending && (
                        <span className="py-1 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                          Audit Pending
                        </span>
                      )}

                      {isVerified && v.fine && (
                        <button
                          type="button"
                          onClick={() => handlePayFine(v.fine!.id, v.id)}
                          disabled={payingFineId === v.fine.id}
                          className="py-1 px-3 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold transition-all"
                        >
                          {payingFineId === v.fine.id ? "Issuing..." : `Pay ₹${v.fine.amount}`}
                        </button>
                      )}

                      {isFineIssued && (
                        <span className="py-1 px-2.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                          Fine Issued &amp; Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Details Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#BAE2EF] flex items-center justify-center text-[#171717]">
              <ShieldCheck className="w-5 h-5 text-[#54A8BD]" strokeWidth={2} />
            </div>
            <div>
              <CardTitle className="text-lg">Registered Citizen Account</CardTitle>
              <CardDescription>
                Navanagar Smart Traffic &amp; Safety Platform
              </CardDescription>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
              <span className="text-[#6F7070]">Full Name</span>
              <span className="font-semibold text-[#171717]">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
              <span className="text-[#6F7070]">Registered Email</span>
              <span className="font-semibold text-[#171717]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
              <span className="text-[#6F7070]">WhatsApp / Phone</span>
              <span className="font-semibold text-[#171717]">{user?.phone || "Not set"}</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
              <span className="text-[#6F7070]">Account Role</span>
              <span className="font-semibold text-[#171717]">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6F7070]">Account Status</span>
              <span className="font-semibold text-[#2D4C13] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CB64A]" />
                {user?.status || "ACTIVE"}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#F5F5F5] flex items-center justify-between">
            <span className="text-xs text-[#999999]">Need to update your details?</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/citizen/profile" className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Go to Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        </Card>

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
