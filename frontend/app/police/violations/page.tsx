"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  getViolationsApi,
  payFineApi,
  ViolationItem,
} from "@/lib/api";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Video,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  ExternalLink,
  CreditCard,
  X,
  XCircle,
  Sparkles,
  Layers,
  ListFilter,
  ArrowUpDown,
  FileText,
  BadgeAlert,
  Check,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Calendar,
  DollarSign
} from "lucide-react";

export default function PoliceViolationsPage() {
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<{
    url: string;
    challan: string;
    plate: string;
    type: string;
  } | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "UNPAID" | "PAID" | "NO_FINE">("ALL");
  const [violationTypeFilter, setViolationTypeFilter] = useState<string>("ALL");
  const [verificationFilter, setVerificationFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    "UNPAID_FIRST" | "PAID_FIRST" | "NEWEST" | "OLDEST" | "AMOUNT_DESC" | "AMOUNT_ASC" | "CONFIDENCE"
  >("UNPAID_FIRST");
  const [viewMode, setViewMode] = useState<"GROUPED" | "TABLE">("GROUPED");

  // Actions
  const [processingFineId, setProcessingFineId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getViolationsApi();
      if (res.success && res.violations) {
        setViolations(res.violations);
      }
    } catch (err) {
      console.error("Failed to load traffic violations for police:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkPaid = async (fineId: number, challanNumber: string) => {
    if (!confirm(`Confirm manual payment collection for Challan ${challanNumber}?`)) {
      return;
    }
    setProcessingFineId(fineId);
    try {
      const res = await payFineApi(fineId);
      if (res.success) {
        setToastMessage({
          text: `Challan ${challanNumber} successfully marked as PAID!`,
          type: "success",
        });
        setTimeout(() => setToastMessage(null), 6000);
        // Update local state
        setViolations((prev) =>
          prev.map((v) =>
            v.fine?.id === fineId
              ? {
                  ...v,
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
      alert(`Failed to update payment status: ${err.message}`);
    } finally {
      setProcessingFineId(null);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    let totalViolations = violations.length;
    let unpaidCount = 0;
    let unpaidAmount = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let verifiedCount = 0;
    let pendingVerificationCount = 0;

    violations.forEach((v) => {
      if (v.fine) {
        if (v.fine.status === "UNPAID") {
          unpaidCount++;
          unpaidAmount += v.fine.amount || 0;
        } else if (v.fine.status === "PAID") {
          paidCount++;
          paidAmount += v.fine.amount || 0;
        }
      }
      if (v.violationStatus === "VERIFIED" || v.violationStatus === "FINE_ISSUED") {
        verifiedCount++;
      } else if (v.violationStatus === "PENDING_VERIFICATION") {
        pendingVerificationCount++;
      }
    });

    return {
      totalViolations,
      unpaidCount,
      unpaidAmount,
      paidCount,
      paidAmount,
      verifiedCount,
      pendingVerificationCount,
    };
  }, [violations]);

  // Filtered and Sorted Violations
  const filteredViolations = useMemo(() => {
    return violations
      .filter((v) => {
        // Payment filter
        if (paymentFilter === "UNPAID") {
          if (!v.fine || v.fine.status !== "UNPAID") return false;
        } else if (paymentFilter === "PAID") {
          if (!v.fine || v.fine.status !== "PAID") return false;
        } else if (paymentFilter === "NO_FINE") {
          if (v.fine) return false;
        }

        // Violation Type filter
        if (violationTypeFilter !== "ALL" && v.violationType !== violationTypeFilter) {
          return false;
        }

        // Verification Status filter
        if (verificationFilter !== "ALL" && v.violationStatus !== verificationFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchPlate = v.vehicle?.plateNumber?.toLowerCase().includes(q);
          const matchChallan = v.challanNumber?.toLowerCase().includes(q);
          const matchOwner = v.owner?.name?.toLowerCase().includes(q);
          const matchPhone = v.owner?.phone?.toLowerCase().includes(q);
          const matchCamera = v.camera?.name?.toLowerCase().includes(q) || v.camera?.id?.toLowerCase().includes(q);
          const matchType = v.violationType?.toLowerCase().includes(q);
          const matchDesc = v.description?.toLowerCase().includes(q);
          if (!matchPlate && !matchChallan && !matchOwner && !matchPhone && !matchCamera && !matchType && !matchDesc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "UNPAID_FIRST") {
          const aUnpaid = a.fine?.status === "UNPAID" ? 1 : 0;
          const bUnpaid = b.fine?.status === "UNPAID" ? 1 : 0;
          if (aUnpaid !== bUnpaid) return bUnpaid - aUnpaid;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "PAID_FIRST") {
          const aPaid = a.fine?.status === "PAID" ? 1 : 0;
          const bPaid = b.fine?.status === "PAID" ? 1 : 0;
          if (aPaid !== bPaid) return bPaid - aPaid;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "NEWEST") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "OLDEST") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "AMOUNT_DESC") {
          return (b.fine?.amount || 0) - (a.fine?.amount || 0);
        }
        if (sortBy === "AMOUNT_ASC") {
          return (a.fine?.amount || 0) - (b.fine?.amount || 0);
        }
        if (sortBy === "CONFIDENCE") {
          return (b.confidence || 0) - (a.confidence || 0);
        }
        return 0;
      });
  }, [violations, paymentFilter, violationTypeFilter, verificationFilter, searchQuery, sortBy]);

  // Grouped datasets for Grouped View
  const groupedData = useMemo(() => {
    const unpaid = filteredViolations.filter((v) => v.fine && v.fine.status === "UNPAID");
    const paid = filteredViolations.filter((v) => v.fine && v.fine.status === "PAID");
    const others = filteredViolations.filter((v) => !v.fine || (v.fine.status !== "UNPAID" && v.fine.status !== "PAID"));
    return { unpaid, paid, others };
  }, [filteredViolations]);

  const renderViolationTypeBadge = (type: string) => {
    switch (type) {
      case "NO_HELMET":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>NO HELMET</span>
          </span>
        );
      case "WRONG_SIDE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>WRONG WAY</span>
          </span>
        );
      case "OVERSPEED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-900 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>SPEED VIOLATION</span>
          </span>
        );
      case "RED_LIGHT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-900 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>RED LIGHT JUMP</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-800 border border-gray-200">
            <span>{type}</span>
          </span>
        );
    }
  };

  const renderPaymentBadge = (fine: ViolationItem["fine"]) => {
    if (!fine) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          <Clock className="w-3 h-3 text-gray-400" />
          <span>NO FINE ISSUED</span>
        </span>
      );
    }
    if (fine.status === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>PAID (₹{fine.amount})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        <span>UNPAID: ₹{fine.amount}</span>
      </span>
    );
  };

  return (
    <DashboardLayout expectedRole="POLICE">
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-[#171717] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 text-xs animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E5] shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] text-white text-xs font-semibold mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-[#8CB64A]" />
                <span>TRAFFIC POLICE ENFORCEMENT DESK</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                Traffic Violations &amp; Payment Status Log
              </h1>
              <p className="text-xs sm:text-sm text-[#6F7070] mt-1.5 max-w-3xl leading-relaxed">
                Complete police registry of traffic violations across Navanagar smart junctions. Sort, filter, and inspect violations grouped by <strong>Paid</strong> and <strong>Unpaid</strong> fine status with Cloudflare R2 video evidence.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                onClick={() => fetchViolations(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F9F9F9] text-xs font-bold text-[#171717] transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#8CB64A]" : ""}`} />
                <span>{refreshing ? "Refreshing..." : "Refresh Feed"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics / KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Violations */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#6F7070]">Total Violations Recorded</span>
              <div className="text-2xl sm:text-3xl font-black text-[#171717] mt-1">
                {stats.totalViolations}
              </div>
              <span className="text-[11px] text-[#8CB64A] font-semibold mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All CCTV junctions
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F0F0F0] flex items-center justify-center text-[#171717]">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Unpaid Fines */}
          <div className="bg-white p-5 rounded-2xl border border-red-200 bg-linear-to-br from-red-50/50 to-white shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-red-700">Outstanding Unpaid Fines</span>
              <div className="text-2xl sm:text-3xl font-black text-red-900 mt-1">
                {stats.unpaidCount} <span className="text-sm font-semibold text-red-600">cases</span>
              </div>
              <span className="text-xs font-bold text-red-700 mt-1 block">
                ₹{stats.unpaidAmount.toLocaleString()} Pending
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Paid Fines */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50/50 to-white shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-800">Settled / Paid Fines</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
                {stats.paidCount} <span className="text-sm font-semibold text-emerald-700">cases</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-1 block">
                ₹{stats.paidAmount.toLocaleString()} Collected
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* AI Verification */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#6F7070]">AI Audited by Nano Banana</span>
              <div className="text-2xl sm:text-3xl font-black text-[#171717] mt-1">
                {stats.verifiedCount}
              </div>
              <span className="text-[11px] text-[#6F7070] font-medium mt-1 block">
                {stats.pendingVerificationCount} pending audit
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter, Search & Grouping Controls */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-soft space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6F7070] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by license plate, citizen name, phone (+91...), challan # or camera..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] focus:bg-white text-xs font-medium text-[#171717] placeholder:text-[#999999] focus:outline-hidden focus:border-[#171717] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Grouped vs Table */}
            <div className="flex items-center gap-1.5 bg-[#F0F0F0] p-1 rounded-xl self-start lg:self-auto">
              <button
                onClick={() => setViewMode("GROUPED")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "GROUPED"
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#6F7070] hover:text-[#171717]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Grouped by Paid/Unpaid</span>
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "TABLE"
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#6F7070] hover:text-[#171717]"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Unified Table</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs & Sort Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0F0F0]">
            {/* Payment Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999999] mr-1">
                Payment:
              </span>
              <button
                onClick={() => setPaymentFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === "ALL"
                    ? "bg-[#171717] text-white"
                    : "bg-[#F5F5F5] text-[#6F7070] hover:bg-[#EAEAEA]"
                }`}
              >
                All ({violations.length})
              </button>
              <button
                onClick={() => setPaymentFilter("UNPAID")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentFilter === "UNPAID"
                    ? "bg-red-700 text-white"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Unpaid Only ({stats.unpaidCount})</span>
              </button>
              <button
                onClick={() => setPaymentFilter("PAID")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentFilter === "PAID"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Paid Only ({stats.paidCount})</span>
              </button>
            </div>

            {/* Sort & Type Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Violation Type Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#6F7070] font-medium hidden sm:inline">Type:</span>
                <select
                  value={violationTypeFilter}
                  onChange={(e) => setViolationTypeFilter(e.target.value)}
                  className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#171717] focus:outline-hidden"
                >
                  <option value="ALL">All Types</option>
                  <option value="OVERSPEED">Speed Violation</option>
                  <option value="NO_HELMET">No Helmet</option>
                  <option value="WRONG_SIDE">Wrong Way</option>
                  <option value="RED_LIGHT">Red Light</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6F7070]" />
                <span className="text-[#6F7070] font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#171717] focus:outline-hidden"
                >
                  <option value="UNPAID_FIRST">Sort: Unpaid Fines First</option>
                  <option value="PAID_FIRST">Sort: Paid Fines First</option>
                  <option value="NEWEST">Date: Newest First</option>
                  <option value="OLDEST">Date: Oldest First</option>
                  <option value="AMOUNT_DESC">Fine: Highest Amount First</option>
                  <option value="AMOUNT_ASC">Fine: Lowest Amount First</option>
                  <option value="CONFIDENCE">AI Confidence (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-[#E5E5E5] flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-[#8CB64A] animate-spin mb-3" />
            <h3 className="text-base font-bold text-[#171717]">Loading Navanagar Traffic Violations...</h3>
            <p className="text-xs text-[#6F7070] mt-1">Querying police database, fine records, and R2 CCTV footage.</p>
          </div>
        ) : filteredViolations.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-[#E5E5E5] text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0F0F0] flex items-center justify-center mx-auto mb-4 text-[#999999]">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">No Traffic Violations Found</h3>
            <p className="text-xs text-[#6F7070] mt-1 max-w-md mx-auto">
              No records match your selected payment, search, or violation filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setPaymentFilter("ALL");
                setViolationTypeFilter("ALL");
                setVerificationFilter("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#171717] text-white text-xs font-bold hover:bg-black transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "GROUPED" ? (
          /* ========================================================
             GROUPED VIEW (Grouped by Unpaid, Paid, Other)
             ======================================================== */
          <div className="space-y-8">
            {/* GROUP 1: UNPAID VIOLATIONS */}
            {(paymentFilter === "ALL" || paymentFilter === "UNPAID") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-red-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block animate-pulse" />
                    <h2 className="text-lg font-black text-red-950 uppercase tracking-tight">
                      Unpaid Violations ({groupedData.unpaid.length})
                    </h2>
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                      Needs Enforcement
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-red-900 bg-red-50 px-3 py-1 rounded-xl border border-red-200">
                    Total Due: ₹{groupedData.unpaid.reduce((sum, v) => sum + (v.fine?.amount || 0), 0).toLocaleString()}
                  </span>
                </div>

                {groupedData.unpaid.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] text-center text-xs text-[#6F7070]">
                    No unpaid violations found matching current filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedData.unpaid.map((v) => (
                      <ViolationPoliceCard
                        key={v.id}
                        violation={v}
                        onWatchVideo={(url) =>
                          setSelectedVideoUrl({
                            url,
                            challan: v.challanNumber,
                            plate: v.vehicle?.plateNumber,
                            type: v.violationType,
                          })
                        }
                        onMarkPaid={(fineId) => handleMarkPaid(fineId, v.challanNumber)}
                        processingFineId={processingFineId}
                        renderViolationTypeBadge={renderViolationTypeBadge}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GROUP 2: PAID VIOLATIONS */}
            {(paymentFilter === "ALL" || paymentFilter === "PAID") && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
                    <h2 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                      Paid &amp; Settled Violations ({groupedData.paid.length})
                    </h2>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Settled
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    Total Collected: ₹{groupedData.paid.reduce((sum, v) => sum + (v.fine?.amount || 0), 0).toLocaleString()}
                  </span>
                </div>

                {groupedData.paid.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] text-center text-xs text-[#6F7070]">
                    No paid violations found matching current filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedData.paid.map((v) => (
                      <ViolationPoliceCard
                        key={v.id}
                        violation={v}
                        onWatchVideo={(url) =>
                          setSelectedVideoUrl({
                            url,
                            challan: v.challanNumber,
                            plate: v.vehicle?.plateNumber,
                            type: v.violationType,
                          })
                        }
                        onMarkPaid={(fineId) => handleMarkPaid(fineId, v.challanNumber)}
                        processingFineId={processingFineId}
                        renderViolationTypeBadge={renderViolationTypeBadge}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GROUP 3: OTHER / PENDING AUDIT */}
            {groupedData.others.length > 0 && paymentFilter === "ALL" && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-gray-400 inline-block" />
                    <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                      Pending AI Verification / No Fine ({groupedData.others.length})
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedData.others.map((v) => (
                    <ViolationPoliceCard
                      key={v.id}
                      violation={v}
                      onWatchVideo={(url) =>
                        setSelectedVideoUrl({
                          url,
                          challan: v.challanNumber,
                          plate: v.vehicle?.plateNumber,
                          type: v.violationType,
                        })
                      }
                      onMarkPaid={(fineId) => handleMarkPaid(fineId, v.challanNumber)}
                      processingFineId={processingFineId}
                      renderViolationTypeBadge={renderViolationTypeBadge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
             UNIFIED TABLE VIEW
             ======================================================== */
          <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F6] border-b border-[#E5E5E5] text-[11px] font-bold text-[#6F7070] uppercase tracking-wider">
                    <th className="p-4">Challan / Vehicle</th>
                    <th className="p-4">Violation Details</th>
                    <th className="p-4">Citizen / Owner</th>
                    <th className="p-4">Location &amp; Time</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0] text-xs font-medium">
                  {filteredViolations.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-[#FBFBFA] transition-colors"
                    >
                      {/* Challan & Vehicle */}
                      <td className="p-4">
                        <div className="font-mono text-xs font-black text-[#171717]">
                          {v.challanNumber}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] font-mono font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>{v.vehicle?.plateNumber || "NO_PLATE"}</span>
                        </div>
                        <div className="text-[10px] text-[#6F7070] mt-0.5 flex items-center gap-1">
                          <Car className="w-3 h-3 text-[#999999]" />
                          <span>{v.vehicle?.vehicleType || "VEHICLE"}</span>
                        </div>
                      </td>

                      {/* Violation Details */}
                      <td className="p-4">
                        <div>{renderViolationTypeBadge(v.violationType)}</div>
                        <p className="text-[11px] text-[#6F7070] mt-1 max-w-xs line-clamp-2">
                          {v.description || "Violation recorded by automated traffic camera"}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700">
                          <Sparkles className="w-3 h-3" />
                          <span>Status: {v.violationStatus}</span>
                        </div>
                      </td>

                      {/* Citizen / Owner */}
                      <td className="p-4">
                        <div className="font-bold text-[#171717] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#6F7070]" />
                          <span>{v.owner?.name || "Unknown Citizen"}</span>
                        </div>
                        <div className="text-[11px] text-[#6F7070] mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#999999]" />
                          <span className="font-mono">{v.owner?.phone || "No phone"}</span>
                        </div>
                        <div className="text-[10px] text-[#999999] mt-0.5">
                          {v.owner?.email || ""}
                        </div>
                      </td>

                      {/* Location & Time */}
                      <td className="p-4">
                        <div className="text-xs font-semibold text-[#171717]">
                          {v.camera?.name || v.camera?.id || "CCTV Junction"}
                        </div>
                        <div className="text-[11px] text-[#6F7070] mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#999999]" />
                          <span>
                            {new Date(v.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#999999]">
                          {new Date(v.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="p-4">
                        <div>{renderPaymentBadge(v.fine)}</div>
                        {v.fine?.status === "PAID" && v.fine.paidAt && (
                          <div className="text-[10px] text-emerald-700 mt-1">
                            Paid on {new Date(v.fine.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-y-1.5">
                        {v.evidence?.videoUrl && (
                          <button
                            onClick={() =>
                              setSelectedVideoUrl({
                                url: v.evidence.videoUrl!,
                                challan: v.challanNumber,
                                plate: v.vehicle?.plateNumber,
                                type: v.violationType,
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#171717] hover:bg-black text-white text-[11px] font-bold transition-all shadow-xs"
                          >
                            <Video className="w-3 h-3 text-[#8CB64A]" />
                            <span>CCTV Video</span>
                          </button>
                        )}

                        {v.fine?.pdfUrl && (
                          <a
                            href={v.fine.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] text-[11px] font-bold transition-all ml-1"
                          >
                            <Download className="w-3 h-3 text-[#6F7070]" />
                            <span>PDF</span>
                          </a>
                        )}

                        {v.fine?.status === "UNPAID" && (
                          <div className="pt-1">
                            <button
                              onClick={() => handleMarkPaid(v.fine!.id, v.challanNumber)}
                              disabled={processingFineId === v.fine.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>{processingFineId === v.fine.id ? "Saving..." : "Mark Paid"}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Video Player Inspection Modal */}
        {selectedVideoUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setSelectedVideoUrl(null)}
          >
            <div
              className="bg-[#171717] text-white w-full max-w-4xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#8CB64A]">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>Cloudflare R2 CCTV Footage</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#8CB64A]/20 text-[#8CB64A] font-mono">
                        {selectedVideoUrl.challan}
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/60">
                      Vehicle: {selectedVideoUrl.plate} | Incident: {selectedVideoUrl.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVideoUrl(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2 sm:p-4 bg-black flex items-center justify-center">
                <video
                  src={selectedVideoUrl.url}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] rounded-2xl border border-white/10 shadow-inner"
                />
              </div>

              <div className="p-4 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
                <span className="truncate max-w-lg font-mono text-[11px]">
                  R2 Stream: {selectedVideoUrl.url}
                </span>
                <a
                  href={selectedVideoUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Raw Link</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Police Violation Card Component
function ViolationPoliceCard({
  violation,
  onWatchVideo,
  onMarkPaid,
  processingFineId,
  renderViolationTypeBadge,
}: {
  violation: ViolationItem;
  onWatchVideo: (url: string) => void;
  onMarkPaid: (fineId: number) => void;
  processingFineId: number | null;
  renderViolationTypeBadge: (type: string) => React.ReactNode;
}) {
  const isPaid = violation.fine?.status === "PAID";

  return (
    <div
      className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-soft flex flex-col justify-between ${
        isPaid
          ? "border-emerald-200 hover:border-emerald-300"
          : "border-red-200 hover:border-red-300 bg-linear-to-b from-red-50/20 to-white"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-[#171717] bg-[#F5F5F5] px-2.5 py-1 rounded-lg">
              {violation.challanNumber}
            </span>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] font-mono font-black text-xs shadow-2xs">
              <span className="text-[10px] text-amber-700 mr-0.5 font-bold">IND</span>
              <span>{violation.vehicle?.plateNumber || "UNKNOWN"}</span>
            </div>
          </div>

          <div>
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PAID</span>
              </span>
            ) : violation.fine ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>UNPAID: ₹{violation.fine.amount}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <Clock className="w-3.5 h-3.5" />
                <span>PENDING</span>
              </span>
            )}
          </div>
        </div>

        {/* Violation Type & Description */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            {renderViolationTypeBadge(violation.violationType)}
            <span className="text-[11px] text-[#6F7070] font-mono">
              Confidence: {Math.round((violation.confidence || 0.85) * 100)}%
            </span>
          </div>
          <p className="text-xs text-[#6F7070] leading-relaxed line-clamp-2">
            {violation.description || "Automatic traffic violation detected by junction cameras."}
          </p>
        </div>

        {/* Citizen / Owner Information Box */}
        <div className="p-3.5 rounded-2xl bg-[#F9F9F9] border border-[#EBEBEB] space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#6F7070] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#999999]" />
              <span>Registered Owner</span>
            </span>
            <span className="font-bold text-[#171717]">
              {violation.owner?.name || "Citizen (Unassigned)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6F7070] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#999999]" />
              <span>Contact Number</span>
            </span>
            <a
              href={`https://wa.me/${violation.owner?.phone?.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
            >
              {violation.owner?.phone || "N/A"}
            </a>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#EAEAEA] text-[11px]">
            <span className="text-[#6F7070] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#999999]" />
              <span>Camera Junction</span>
            </span>
            <span className="font-semibold text-[#171717]">
              {violation.camera?.name || violation.camera?.id || "Alpha Junction"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions & Timestamp */}
      <div className="pt-3 border-t border-[#F0F0F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-[#999999]">
          {new Date(violation.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {violation.evidence?.videoUrl && (
            <button
              onClick={() => onWatchVideo(violation.evidence.videoUrl!)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Video className="w-3.5 h-3.5 text-[#8CB64A]" />
              <span>Watch Video</span>
            </button>
          )}

          {violation.fine?.pdfUrl && (
            <a
              href={violation.fine.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F9F9F9] text-[#171717] text-xs font-bold transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#6F7070]" />
              <span>PDF</span>
            </a>
          )}

          {!isPaid && violation.fine && (
            <button
              onClick={() => onMarkPaid(violation.fine!.id)}
              disabled={processingFineId === violation.fine.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-3 h-3" />
              <span>{processingFineId === violation.fine.id ? "..." : "Mark Paid"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
