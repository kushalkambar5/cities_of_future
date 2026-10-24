"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  getViolationsApi,
  payFineApi,
  verifyViolationWithNanoApi,
  verifyAllPendingWithNanoApi,
  ViolationItem,
} from "@/lib/api";
import {
  FileText,
  AlertTriangle,
  Search,
  RefreshCw,
  Video,
  Download,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Car,
  User,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  Check,
  CreditCard,
  X,
  Sparkles,
  Bot,
  XCircle,
} from "lucide-react";

export default function AdminViolationsPage() {
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [violationStatusFilter, setViolationStatusFilter] = useState<string>("ALL");
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [batchVerifying, setBatchVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const res = await getViolationsApi();
      if (res.success && res.violations) {
        setViolations(res.violations);
      }
    } catch (err) {
      console.error("Failed to load violations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWithNano = async (violationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoadingId(violationId);
    try {
      const res = await verifyViolationWithNanoApi(violationId);
      if (res.success) {
        setSuccessMsg(
          `Google Nano Banana Audit: Violation #${violationId} is ${res.status}! (${res.audit.reason})`
        );
        setTimeout(() => setSuccessMsg(null), 7000);
        // Refresh local data
        setViolations((prev) =>
          prev.map((v) =>
            v.id === violationId
              ? {
                  ...v,
                  violationStatus: res.status,
                  nanoAuditReason: res.audit.reason,
                }
              : v
          )
        );
      }
    } catch (err: any) {
      alert(`Nano Banana audit failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchVerifyNano = async () => {
    setBatchVerifying(true);
    try {
      const res = await verifyAllPendingWithNanoApi();
      if (res.success) {
        setSuccessMsg(
          `Batch Audit Complete: ${res.verifiedCount} VERIFIED, ${res.rejectedCount} REJECTED by Google Nano Banana.`
        );
        setTimeout(() => setSuccessMsg(null), 7000);
        await fetchViolations();
      }
    } catch (err: any) {
      alert(`Batch verification error: ${err.message}`);
    } finally {
      setBatchVerifying(false);
    }
  };

  const handleMarkAsPaid = async (fineId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoadingId(fineId);
    try {
      const res = await payFineApi(fineId);
      if (res.success) {
        setSuccessMsg(`Fine #${fineId} paid and status updated to FINE_ISSUED.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        // Refresh local data
        setViolations((prev) =>
          prev.map((v) =>
            v.fine?.id === fineId
              ? {
                  ...v,
                  violationStatus: "FINE_ISSUED",
                  fine: {
                    ...v.fine,
                    status: "PAID",
                    paidAt: new Date().toISOString(),
                  },
                }
              : v
          )
        );
      }
    } catch (err: any) {
      alert(`Error updating fine: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered dataset
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesType =
        typeFilter === "ALL" || v.violationType === typeFilter;
      const matchesVStatus =
        violationStatusFilter === "ALL" ||
        v.violationStatus === violationStatusFilter;

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        v.challanNumber.toLowerCase().includes(q) ||
        v.vehicle.plateNumber.toLowerCase().includes(q) ||
        v.owner.name.toLowerCase().includes(q) ||
        v.owner.phone.toLowerCase().includes(q) ||
        v.owner.email.toLowerCase().includes(q) ||
        v.camera.id.toLowerCase().includes(q);

      return matchesType && matchesVStatus && matchesSearch;
    });
  }, [violations, searchTerm, typeFilter, violationStatusFilter]);

  // Aggregate stats
  const totalViolations = violations.length;
  const pendingAuditCount = violations.filter(
    (v) => v.violationStatus === "PENDING_VERIFICATION"
  ).length;
  const verifiedCount = violations.filter(
    (v) => v.violationStatus === "VERIFIED"
  ).length;
  const fineIssuedCount = violations.filter(
    (v) => v.violationStatus === "FINE_ISSUED"
  ).length;

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
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>REJECTED</span>
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

  const getViolationTypeClass = (type: string) => {
    switch (type) {
      case "NO_HELMET":
        return "bg-amber-50 text-amber-900 border-amber-200";
      case "WRONG_SIDE":
        return "bg-rose-50 text-rose-900 border-rose-200";
      case "OVERSPEED":
        return "bg-blue-50 text-blue-900 border-blue-200";
      case "RED_LIGHT":
        return "bg-red-50 text-red-900 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  return (
    <DashboardLayout expectedRole="ADMIN">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E5] shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] text-white text-xs font-semibold mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-[#BAE2EF]" />
                <span>AI AUDIT &amp; ENFORCEMENT ENGINE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                Traffic Violations &amp; Google Nano Banana Verification
              </h1>
              <p className="text-xs sm:text-sm text-[#6F7070] mt-1.5 max-w-3xl leading-relaxed">
                Review automated detections. Every model violation enters as <code className="bg-[#F0F0F0] px-1.5 py-0.5 rounded text-[11px] font-mono text-[#171717]">PENDING_VERIFICATION</code> and is audited by <strong>Google Nano Banana</strong> to determine validity before fine issuance and citizen settlement.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {pendingAuditCount > 0 && (
                <button
                  onClick={handleBatchVerifyNano}
                  disabled={batchVerifying}
                  className="py-2.5 px-4 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Verify all pending violations with Google Nano Banana"
                >
                  <Bot className={`w-4 h-4 text-[#BAE2EF] ${batchVerifying ? "animate-spin" : ""}`} />
                  <span>
                    {batchVerifying ? "Auditing with Nano Banana..." : `Verify All (${pendingAuditCount}) with Nano Banana`}
                  </span>
                </button>
              )}

              <button
                onClick={fetchViolations}
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

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0F0F0]">
            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-[#6F7070] uppercase tracking-wider block">
                Total Violations
              </span>
              <span className="text-2xl font-extrabold text-[#171717] block mt-1">
                {totalViolations}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                Total detections recorded
              </span>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Pending Verification</span>
              </span>
              <span className="text-2xl font-extrabold text-amber-700 block mt-1">
                {pendingAuditCount}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                Awaiting Nano Banana audit
              </span>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Verified by Nano Banana</span>
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 block mt-1">
                {verifiedCount}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                Approved by AI auditor
              </span>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#EAEAEA]">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Fine Issued / Settled</span>
              </span>
              <span className="text-2xl font-extrabold text-blue-700 block mt-1">
                {fineIssuedCount}
              </span>
              <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                Citizen processed challans
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E5E5E5] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              type="text"
              placeholder="Search by plate, owner name, phone, challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-full pl-9 pr-4 py-2 text-xs font-medium text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#171717]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#6F7070]">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={violationStatusFilter}
                onChange={(e) => setViolationStatusFilter(e.target.value)}
                className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-full px-3 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none"
              >
                <option value="ALL">All Audit Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="VERIFIED">Verified (Nano Banana)</option>
                <option value="FINE_ISSUED">Fine Issued</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#6F7070]">
              <span>Violation:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-full px-3 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="NO_HELMET">No Helmet</option>
                <option value="WRONG_SIDE">Wrong Side</option>
                <option value="OVERSPEED">Overspeed</option>
                <option value="RED_LIGHT">Red Light</option>
              </select>
            </div>
          </div>
        </div>

        {/* Violations & Fines Master Table */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717]">
                Violation Telemetry Records ({filteredViolations.length})
              </h2>
            </div>
            <span className="text-xs text-[#6F7070]">
              Showing {filteredViolations.length} of {violations.length} total records
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#171717] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#6F7070]">
                Loading Violations and Fines...
              </p>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="p-16 text-center">
              <AlertTriangle className="w-8 h-8 text-[#8C8C8C] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#171717]">No violations match your filter</p>
              <p className="text-[11px] text-[#6F7070] mt-1">
                Try selecting "All Audit Statuses" or adjusting your search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-[#6F7070] uppercase font-bold text-[10px] tracking-wider border-b border-[#EAEAEA]">
                  <tr>
                    <th className="py-3 px-4">Challan &amp; Date</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Related Citizen</th>
                    <th className="py-3 px-4">Violation Details</th>
                    <th className="py-3 px-4">Google Nano Banana Status</th>
                    <th className="py-3 px-4">Fine Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {filteredViolations.map((v) => {
                    const isPaid = v.fine?.status === "PAID";
                    const isPending = v.violationStatus === "PENDING_VERIFICATION";
                    return (
                      <tr key={v.id} className="hover:bg-[#FAFAFA] transition-colors">
                        {/* Challan & Date */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-[#171717] block">
                            {v.challanNumber}
                          </span>
                          <span className="text-[10px] text-[#8C8C8C] block mt-0.5">
                            {new Date(v.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-[10px] text-[#54A8BD] block font-mono">
                            Sensor: {v.camera.id}
                          </span>
                        </td>

                        {/* Vehicle */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#171717] text-white font-mono text-[11px] font-bold">
                              {v.vehicle.plateNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#6F7070] block mt-1 flex items-center gap-1">
                            <Car className="w-3 h-3 text-[#8C8C8C]" />
                            {v.vehicle.vehicleType}
                          </span>
                        </td>

                        {/* Related Citizen / Owner */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#54A8BD]" />
                            <span className="font-bold text-[#171717]">
                              {v.owner.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6F7070] mt-0.5 space-y-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5 text-[#8C8C8C]" />
                              {v.owner.phone}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[#8C8C8C] truncate max-w-[170px]">
                              <Mail className="w-2.5 h-2.5 text-[#8C8C8C]" />
                              {v.owner.email}
                            </span>
                          </div>
                        </td>

                        {/* Violation Type & Description */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${getViolationTypeClass(
                              v.violationType
                            )}`}
                          >
                            {v.violationType.replace(/_/g, " ")}
                          </span>
                          <span
                            className="text-[10px] text-[#6F7070] block mt-1 line-clamp-1 max-w-[200px]"
                            title={v.description}
                          >
                            {v.description}
                          </span>
                        </td>

                        {/* Google Nano Banana Verification Status */}
                        <td className="py-3.5 px-4">
                          {renderViolationStatusBadge(v.violationStatus)}
                          {v.nanoAuditReason && (
                            <span
                              className="text-[9px] text-[#6F7070] block mt-1 line-clamp-2 max-w-[220px] bg-[#F7F7F6] p-1.5 rounded-lg border border-[#EAEAEA]"
                              title={v.nanoAuditReason}
                            >
                              🤖 <strong>Nano Banana:</strong> {v.nanoAuditReason}
                            </span>
                          )}
                        </td>

                        {/* Fine Amount & Settlement Status */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-sm text-[#171717] block">
                            ₹{v.fine?.amount?.toLocaleString() || 0}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${
                              isPaid
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isPaid ? "PAID" : "UNPAID"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Verify with Nano Banana Button for Pending Violations */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={(e) => handleVerifyWithNano(v.id, e)}
                                disabled={actionLoadingId === v.id}
                                className="py-1 px-2 rounded-full bg-[#171717] hover:bg-black text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                                title="Run Google Nano Banana AI Verification"
                              >
                                {actionLoadingId === v.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-[#BAE2EF]" />
                                ) : (
                                  <Bot className="w-3 h-3 text-[#BAE2EF]" />
                                )}
                                <span>Verify Nano</span>
                              </button>
                            )}

                            {/* Evidence Video Modal Button */}
                            {v.evidence.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setSelectedVideoUrl(v.evidence.videoUrl!)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] transition-all"
                                title="View R2 Evidence Video"
                              >
                                <Video className="w-3.5 h-3.5 text-[#54A8BD]" />
                              </button>
                            )}

                            {/* PDF E-Challan Link */}
                            {v.fine?.pdfUrl && (
                              <a
                                href={v.fine.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] transition-all"
                                title="Download Official E-Challan PDF"
                              >
                                <Download className="w-3.5 h-3.5 text-[#171717]" />
                              </a>
                            )}

                            {/* Mark Paid Button if Unpaid & Verified */}
                            {!isPaid && v.fine && !isPending && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsPaid(v.fine!.id, e)}
                                disabled={actionLoadingId === v.fine.id}
                                className="py-1 px-2 rounded-full bg-[#EFEFEF] hover:bg-[#E0E0E0] text-[#171717] text-[10px] font-bold transition-all flex items-center gap-1"
                                title="Mark Fine as Paid"
                              >
                                <CreditCard className="w-3 h-3 text-[#171717]" />
                                <span>Settle</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                  <h3 className="text-sm font-bold">Cloudflare R2 Violation Footage</h3>
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
