"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  getDangerousVehiclesApi,
  DangerousVehicleItem,
  DangerousVehiclesResponse,
} from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Flame,
  ShieldAlert,
  ShieldCheck,
  User,
  Car,
  Bike,
  Gauge,
  Sliders,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Phone,
  Mail,
  Video,
  Clock,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";

export default function DangerousVehiclesPage() {
  const [data, setData] = useState<DangerousVehiclesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [threshold, setThreshold] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedViolation, setSelectedViolation] = useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [selectedVideo, setSelectedVideo] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("score_desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modals & Detail Drawers
  const [selectedVehicle, setSelectedVehicle] = useState<DangerousVehicleItem | null>(null);
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);
  const [rawJsonVehicle, setRawJsonVehicle] = useState<DangerousVehicleItem | null>(null);
  const [showFullRawModal, setShowFullRawModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    fetchDangerousVehicles();
  }, []);

  const fetchDangerousVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDangerousVehiclesApi({ threshold: 0 });
      if (res.success) {
        setData(res);
      } else {
        setError("Failed to retrieve dangerous vehicles from FastAPI pipeline.");
      }
    } catch (err: any) {
      console.error("Error loading dangerous vehicles:", err);
      setError(err?.message || "Could not connect to FastAPI neural pipeline or backend.");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and sorting for instant interactive responsiveness
  const filteredVehicles = useMemo(() => {
    if (!data?.vehicles) return [];
    let list = [...data.vehicles];

    // 1. Threshold filter
    if (threshold > 0) {
      list = list.filter((v) => v.danger_score >= threshold);
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.number_plate.toLowerCase().includes(q) ||
          v.person.name.toLowerCase().includes(q) ||
          v.person.phone.toLowerCase().includes(q) ||
          String(v.track_id).includes(q)
      );
    }

    // 3. Violation filter
    if (selectedViolation !== "ALL") {
      const vTarget = selectedViolation.toLowerCase();
      list = list.filter((v) =>
        v.violations.some((vl) => vl.toLowerCase().includes(vTarget))
      );
    }

    // 4. Risk Level filter
    if (selectedRisk !== "ALL") {
      list = list.filter((v) => v.risk_level === selectedRisk);
    }

    // 5. Video feed filter
    if (selectedVideo !== "ALL") {
      list = list.filter((v) => v.source_video === selectedVideo);
    }

    // 6. Sort
    list.sort((a, b) => {
      if (sortBy === "score_asc") return a.danger_score - b.danger_score;
      if (sortBy === "speed_desc") return b.speed_kmh - a.speed_kmh;
      if (sortBy === "violations_desc") return b.violations.length - a.violations.length;
      if (sortBy === "name_asc") return a.person.name.localeCompare(b.person.name);
      // Default: score_desc
      if (b.danger_score !== a.danger_score) {
        return b.danger_score - a.danger_score;
      }
      return b.violations.length - a.violations.length;
    });

    return list;
  }, [data, threshold, searchQuery, selectedViolation, selectedRisk, selectedVideo, sortBy]);

  const top5Persons = useMemo(() => {
    return data?.top5 || [];
  }, [data]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportCsv = () => {
    if (!filteredVehicles.length) return;
    const headers = [
      "Rank",
      "License Plate",
      "Person Name",
      "Phone",
      "Vehicle Type",
      "Danger Score",
      "Risk Level",
      "Speed (km/h)",
      "Violations",
      "Helmet Status",
      "Seatbelt Status",
      "Accident Status",
      "Source Video",
      "Timestamp",
    ];

    const rows = filteredVehicles.map((v, idx) => [
      idx + 1,
      `"${v.number_plate}"`,
      `"${v.person.name}"`,
      `"${v.person.phone}"`,
      v.vehicle_type,
      v.danger_score,
      v.risk_level,
      v.speed_kmh,
      `"${v.violations.join(", ")}"`,
      v.helmet_status,
      v.seatbelt_status,
      v.accident_status,
      `"${v.source_video}"`,
      v.first_seen_timestamp,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `navanagar_dangerous_vehicles_threshold_${threshold}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
          <Flame className="w-3 h-3 text-red-600 fill-red-500" />
          <span>CRITICAL ({score.toFixed(1)})</span>
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          <span>HIGH RISK ({score.toFixed(1)})</span>
        </span>
      );
    }
    if (score >= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span>MODERATE ({score.toFixed(1)})</span>
        </span>
      );
    }
    if (score > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <span>LOW ({score.toFixed(1)})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
        <ShieldCheck className="w-3 h-3 text-green-600" />
        <span>SAFE (0.0)</span>
      </span>
    );
  };

  return (
    <DashboardLayout expectedRole="ADMIN">
      <div className="space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
                  Dangerous Vehicles &amp; Driver Risk
                </h1>
                <p className="text-xs sm:text-sm text-[#6F7070] mt-0.5">
                  Live danger scores generated directly by the FastAPI multi-model AI pipeline across city CCTV feeds.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDangerousVehicles}
              disabled={loading}
              className="rounded-full text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Feed</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullRawModal(true)}
              className="rounded-full text-xs font-semibold gap-1.5 bg-[#171717] text-white hover:bg-[#333333]"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Raw FastAPI Pipeline JSON</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!filteredVehicles.length}
              className="rounded-full text-xs font-semibold gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Safety Metrics Pulse Grid */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <Card className="p-4 bg-white border border-[#EBEBEB] shadow-xs">
              <span className="text-[11px] font-medium text-[#6F7070] block">Fleet Vehicles</span>
              <span className="text-2xl font-extrabold text-[#171717] mt-1 block">
                {data.totalAnalyzed}
              </span>
              <span className="text-[10px] text-[#8C8C8C] mt-0.5 block">Total Analyzed</span>
            </Card>

            <Card className="p-4 bg-red-50/60 border border-red-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-600 fill-red-500" />
                Critical (&ge;80)
              </span>
              <span className="text-2xl font-extrabold text-red-800 mt-1 block">
                {data.summary.criticalCount}
              </span>
              <span className="text-[10px] text-red-600/80 mt-0.5 block">Urgent Action</span>
            </Card>

            <Card className="p-4 bg-orange-50/60 border border-orange-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-orange-700 block">High Risk (60-79)</span>
              <span className="text-2xl font-extrabold text-orange-800 mt-1 block">
                {data.summary.highRiskCount}
              </span>
              <span className="text-[10px] text-orange-600/80 mt-0.5 block">Watchlist</span>
            </Card>

            <Card className="p-4 bg-amber-50/60 border border-amber-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 block">Moderate (30-59)</span>
              <span className="text-2xl font-extrabold text-amber-900 mt-1 block">
                {data.summary.mediumRiskCount}
              </span>
              <span className="text-[10px] text-amber-700/80 mt-0.5 block">Monitored</span>
            </Card>

            <Card className="p-4 bg-green-50/60 border border-green-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                Safe Fleet
              </span>
              <span className="text-2xl font-extrabold text-green-800 mt-1 block">
                {data.summary.safeCount}
              </span>
              <span className="text-[10px] text-green-600/80 mt-0.5 block">Zero Violations</span>
            </Card>

            <Card className="p-4 bg-white border border-[#EBEBEB] shadow-xs">
              <span className="text-[11px] font-medium text-[#6F7070] block">Max Danger Score</span>
              <span className="text-2xl font-extrabold text-red-600 mt-1 block">
                {data.summary.maxDangerScore.toFixed(0)}/100
              </span>
              <span className="text-[10px] text-[#8C8C8C] mt-0.5 block">
                Avg: {data.summary.averageDangerScore} pts
              </span>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TOP 5 DANGEROUS PERSONS & VEHICLES SPOTLIGHT BANNER / CARDS               */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-[#171717] tracking-tight">
                Top 5 Most Dangerous Persons &amp; Vehicles
              </h2>
            </div>
            <span className="text-xs text-[#6F7070]">
              Ranked dynamically by raw multi-factor FastAPI safety penalty weights
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {top5Persons.map((veh, idx) => {
              const rankColor =
                idx === 0
                  ? "bg-red-600 text-white border-red-700 shadow-md"
                  : idx === 1
                  ? "bg-orange-600 text-white border-orange-700"
                  : idx === 2
                  ? "bg-amber-600 text-white border-amber-700"
                  : "bg-[#171717] text-white border-black";

              return (
                <div
                  key={idx}
                  className="relative rounded-2xl bg-white border-2 border-[#E5E5E5] hover:border-red-400 p-4 flex flex-col justify-between shadow-soft hover:shadow-md transition-all group"
                >
                  {/* Rank Badge Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${rankColor}`}
                      >
                        Rank #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1 text-red-600 font-extrabold text-sm">
                        <Flame className="w-4 h-4 fill-red-500 animate-pulse" />
                        <span>{veh.danger_score.toFixed(0)}</span>
                        <span className="text-[10px] text-[#8C8C8C]">/100</span>
                      </div>
                    </div>

                    {/* Person / Driver Details */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#54A8BD]" />
                        <span className="text-xs font-extrabold text-[#171717] truncate">
                          {veh.person.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6F7070]">
                        <Phone className="w-3 h-3 text-[#8C8C8C]" />
                        <span className="font-mono">{veh.person.phone}</span>
                      </div>
                    </div>

                    {/* Vehicle Plate Card */}
                    <div className="p-2.5 rounded-xl bg-[#F7F7F6] border border-[#EBEBEB] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-[#E0E0E0] text-[#171717] shadow-2xs">
                          {veh.number_plate}
                        </span>
                        <span className="text-[10px] text-[#6F7070] uppercase font-bold flex items-center gap-1">
                          {veh.vehicle_type === "MOTORCYCLE" ? (
                            <Bike className="w-3 h-3 text-[#54A8BD]" />
                          ) : (
                            <Car className="w-3 h-3 text-[#54A8BD]" />
                          )}
                          {veh.vehicle_type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#6F7070] font-mono">
                        <span>Speed: <strong className="text-[#171717]">{veh.speed_kmh} km/h</strong></span>
                        <span>Track #{veh.track_id}</span>
                      </div>
                    </div>

                    {/* Infractions detected */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-[#8C8C8C] block mb-1">
                        Detected Infractions:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {veh.violations.map((violation, vi) => (
                          <span
                            key={vi}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-50 text-red-700 border border-red-200"
                          >
                            {violation.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => setSelectedVehicle(veh)}
                      className="text-[11px] font-bold text-[#54A8BD] hover:underline flex items-center gap-1"
                    >
                      <span>Dossier</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        setRawJsonVehicle(veh);
                        setShowRawJsonModal(true);
                      }}
                      className="text-[10px] font-mono bg-[#EFEFEF] hover:bg-[#E0E0E0] px-2 py-1 rounded-md text-[#171717] transition-colors"
                      title="Inspect Raw FastAPI JSON for this vehicle"
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE CONTROLS BAR: THRESHOLD SLIDER & MULTI-FILTER                 */}
        {/* ========================================================================= */}
        <Card className="p-5 bg-white border border-[#E5E5E5] shadow-soft">
          <div className="space-y-5">
            {/* 1. Dynamic Threshold Slider */}
            <div className="bg-[#F7F7F6] p-4 rounded-2xl border border-[#EBEBEB]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#54A8BD]" />
                  <span className="text-xs font-bold text-[#171717]">
                    FastAPI Danger Score Threshold Filter:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800 font-mono">
                    &ge; {threshold} / 100
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setThreshold(0)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      threshold === 0
                        ? "bg-[#171717] text-white shadow-2xs"
                        : "bg-white text-[#6F7070] hover:text-[#171717] border border-[#E0E0E0]"
                    }`}
                  >
                    All (&ge;0)
                  </button>
                  <button
                    onClick={() => setThreshold(30)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      threshold === 30
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-white text-[#6F7070] hover:text-[#171717] border border-[#E0E0E0]"
                    }`}
                  >
                    Moderate (&ge;30)
                  </button>
                  <button
                    onClick={() => setThreshold(60)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      threshold === 60
                        ? "bg-orange-600 text-white shadow-2xs"
                        : "bg-white text-[#6F7070] hover:text-[#171717] border border-[#E0E0E0]"
                    }`}
                  >
                    High (&ge;60)
                  </button>
                  <button
                    onClick={() => setThreshold(80)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      threshold === 80
                        ? "bg-red-600 text-white shadow-2xs"
                        : "bg-white text-[#6F7070] hover:text-[#171717] border border-[#E0E0E0]"
                    }`}
                  >
                    Critical (&ge;80)
                  </button>
                </div>
              </div>

              {/* Range input */}
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-[#E0E0E0] rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="font-mono text-xs font-bold text-[#171717] w-12 text-right">
                  {threshold}%
                </span>
              </div>
            </div>

            {/* 2. Search & Dropdown Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#999999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-full bg-[#F7F7F6] text-xs text-[#171717] placeholder-[#999999] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                />
              </div>

              {/* Violation Type Dropdown */}
              <div>
                <select
                  value={selectedViolation}
                  onChange={(e) => setSelectedViolation(e.target.value)}
                  className="w-full h-10 px-3 rounded-full bg-[#F7F7F6] text-xs text-[#171717] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                >
                  <option value="ALL">All Violations</option>
                  <option value="wrong_side">Wrong Side Driving</option>
                  <option value="illegal_u_turn">Illegal U-Turn</option>
                  <option value="no_helmet">No Helmet</option>
                  <option value="no_seatbelt">No Seatbelt</option>
                  <option value="overspeed">Overspeeding</option>
                  <option value="zigzag">Zigzag Aggressive Overtake</option>
                  <option value="accident">Accident / Collision</option>
                </select>
              </div>

              {/* Risk Level Dropdown */}
              <div>
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="w-full h-10 px-3 rounded-full bg-[#F7F7F6] text-xs text-[#171717] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="CRITICAL">Critical Hazard (&ge;80)</option>
                  <option value="HIGH">High Risk (60-79)</option>
                  <option value="MEDIUM">Moderate (30-59)</option>
                  <option value="LOW">Low Risk (1-29)</option>
                  <option value="SAFE">Safe Fleet (0)</option>
                </select>
              </div>

              {/* Video Source Dropdown */}
              <div>
                <select
                  value={selectedVideo}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  className="w-full h-10 px-3 rounded-full bg-[#F7F7F6] text-xs text-[#171717] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD] truncate"
                >
                  <option value="ALL">All Camera Streams</option>
                  {data?.availableVideos?.map((v, i) => (
                    <option key={i} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-full bg-[#F7F7F6] text-xs text-[#171717] border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                >
                  <option value="score_desc">Danger Score: High to Low</option>
                  <option value="score_asc">Danger Score: Low to High</option>
                  <option value="speed_desc">Fastest Speed First</option>
                  <option value="violations_desc">Most Infractions First</option>
                  <option value="name_asc">Driver Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Filter Summary & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F0F0]">
              <span className="text-xs text-[#6F7070]">
                Showing <strong className="text-[#171717]">{filteredVehicles.length}</strong> of{" "}
                {data?.totalAnalyzed || 0} evaluated vehicles
                {threshold > 0 && ` (Filtered by Danger Score &ge; ${threshold})`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setThreshold(0);
                    setSearchQuery("");
                    setSelectedViolation("ALL");
                    setSelectedRisk("ALL");
                    setSelectedVideo("ALL");
                    setSortBy("score_desc");
                  }}
                  className="text-xs text-[#6F7070] hover:text-red-600 font-semibold underline"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* MAIN REGISTRY TABLE OF DANGEROUS VEHICLES & PERSON SCORES                 */}
        {/* ========================================================================= */}
        <Card className="bg-white border border-[#E5E5E5] shadow-soft overflow-hidden">
          <CardHeader className="p-5 border-b border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-[#171717]">
                Live Evaluated Vehicles &amp; Registered Drivers
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Every record displays raw neural detection outputs with identity association from city registry.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8C8C8C] font-mono">
                {filteredVehicles.length} vehicles matching
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#6F7070]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#171717] mb-2" />
                <span>Aggregating raw FastAPI neural scores and driver profiles...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-red-600 space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-red-500" />
                <p className="font-bold">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchDangerousVehicles} className="mt-2 text-xs">
                  Retry Connection
                </Button>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#6F7070] space-y-1">
                <p className="font-semibold text-sm text-[#171717]">No vehicles match the selected criteria.</p>
                <p>Try lowering the danger score threshold or clearing search filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[10px] font-extrabold text-[#6F7070] uppercase tracking-wider bg-[#F9F9F9]">
                      <th className="py-3.5 px-4">Rank / Score</th>
                      <th className="py-3.5 px-4">Person (Driver / Owner)</th>
                      <th className="py-3.5 px-4">Plate &amp; Vehicle</th>
                      <th className="py-3.5 px-4">Speed</th>
                      <th className="py-3.5 px-4">Safety Gear</th>
                      <th className="py-3.5 px-4">Infractions Flagged</th>
                      <th className="py-3.5 px-4">Feed &amp; Time</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0] text-xs">
                    {filteredVehicles.map((v, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                        onClick={() => setSelectedVehicle(v)}
                      >
                        {/* 1. Score & Risk Level */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-[#6F7070]">
                                #{idx + 1}
                              </span>
                              {getRiskBadge(v.danger_score)}
                            </div>
                            {/* Score progress bar */}
                            <div className="w-24 h-1.5 bg-[#EAEAEA] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  v.danger_score >= 80
                                    ? "bg-red-600"
                                    : v.danger_score >= 60
                                    ? "bg-orange-500"
                                    : v.danger_score >= 30
                                    ? "bg-amber-500"
                                    : "bg-blue-400"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, v.danger_score))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 2. Person (Owner) */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-extrabold text-[#171717] block truncate">
                              {v.person.name}
                            </span>
                            <span className="text-[11px] text-[#6F7070] font-mono block">
                              {v.person.phone}
                            </span>
                          </div>
                        </td>

                        {/* 3. Plate & Vehicle */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-[#EFEFEF] px-2 py-0.5 rounded text-[11px] font-bold text-[#171717] border border-[#E0E0E0]">
                                {v.number_plate}
                              </span>
                              {v.generated_plate && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                  Synth
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#6F7070] uppercase font-semibold block">
                              {v.vehicle_type} (Track #{v.track_id})
                            </span>
                          </div>
                        </td>

                        {/* 4. Speed */}
                        <td className="py-3.5 px-4 font-mono">
                          {v.speed_kmh ? (
                            <span
                              className={`font-bold ${
                                v.speed_kmh > 60.0 ? "text-red-600" : "text-[#171717]"
                              }`}
                            >
                              {v.speed_kmh} km/h
                            </span>
                          ) : (
                            <span className="text-[#8C8C8C]">-</span>
                          )}
                        </td>

                        {/* 5. Helmet / Seatbelt */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {v.helmet_status !== "unknown" && (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  v.helmet_status === "no_helmet"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {v.helmet_status === "no_helmet" ? "No Helmet" : "Helmet On"}
                              </span>
                            )}
                            {v.seatbelt_status !== "unknown" && (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  v.seatbelt_status === "no_belt"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {v.seatbelt_status === "no_belt" ? "No Seatbelt" : "Seatbelt Fastened"}
                              </span>
                            )}
                            {v.helmet_status === "unknown" && v.seatbelt_status === "unknown" && (
                              <span className="text-[11px] text-[#8C8C8C]">N/A</span>
                            )}
                          </div>
                        </td>

                        {/* 6. Infractions */}
                        <td className="py-3.5 px-4">
                          {v.violations.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {v.violations.map((vl, vi) => (
                                <span
                                  key={vi}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-50 text-red-700 border border-red-200"
                                >
                                  {vl.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-green-600 font-semibold">None</span>
                          )}
                        </td>

                        {/* 7. Feed & Time */}
                        <td className="py-3.5 px-4">
                          <div className="max-w-[140px]">
                            <span className="text-[11px] font-medium text-[#171717] block truncate" title={v.source_video}>
                              {v.source_video}
                            </span>
                            <span className="text-[10px] text-[#6F7070] font-mono block">
                              {v.first_seen_timestamp}
                            </span>
                          </div>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRawJsonVehicle(v);
                                setShowRawJsonModal(true);
                              }}
                              className="text-[10px] h-7 px-2 font-mono"
                              title="View Raw FastAPI JSON"
                            >
                              FastAPI JSON
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVehicle(v)}
                              className="text-[11px] h-7 px-2.5 font-bold"
                            >
                              View Dossier
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* MODAL 1: SINGLE VEHICLE DOSSIER DRAWER / MODAL                            */}
        {/* ========================================================================= */}
        {selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E5E5E5] space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#171717]">
                      Driver &amp; Vehicle Safety Dossier
                    </h3>
                    <p className="text-xs text-[#6F7070]">
                      Plate #{selectedVehicle.number_plate} &bull; Track #{selectedVehicle.track_id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#EAEAEA] flex items-center justify-center text-[#6F7070]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Danger Score Highlight Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
                    FastAPI Calculated Danger Score
                  </span>
                  <p className="text-xs text-[#6F7070] mt-0.5">
                    Evaluated across trajectory dynamics, lane violations, and speeding.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-red-600 font-mono">
                    {selectedVehicle.danger_score.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#6F7070] block font-mono">out of 100.0</span>
                </div>
              </div>

              {/* Driver & Person Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB] space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                    Registered Person (Citizen)
                  </span>
                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-[#171717]">{selectedVehicle.person.name}</p>
                    <p className="text-[#6F7070] flex items-center gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-[#8C8C8C]" />
                      <span>{selectedVehicle.person.phone}</span>
                    </p>
                    <p className="text-[#6F7070] flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-[#8C8C8C]" />
                      <span>{selectedVehicle.person.email}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EBEBEB] space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                    Vehicle Specification
                  </span>
                  <div className="space-y-1">
                    <p className="font-mono font-extrabold text-sm text-[#171717]">
                      {selectedVehicle.number_plate}
                    </p>
                    <p className="text-[#6F7070]">
                      Type: <strong className="text-[#171717]">{selectedVehicle.vehicle_type}</strong>
                    </p>
                    <p className="text-[#6F7070]">
                      ANPR Confidence:{" "}
                      <strong className="text-[#171717]">
                        {(selectedVehicle.plate_confidence * 100).toFixed(0)}%
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recorded Dynamics */}
              <div className="p-4 rounded-2xl bg-white border border-[#EBEBEB] space-y-3">
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                  CCTV Detection Dynamics
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F7F6]">
                    <span className="text-[10px] text-[#6F7070] block">Speed</span>
                    <span className="font-extrabold text-[#171717]">
                      {selectedVehicle.speed_kmh ? `${selectedVehicle.speed_kmh} km/h` : "N/A"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F7F6]">
                    <span className="text-[10px] text-[#6F7070] block">Helmet</span>
                    <span className="font-extrabold text-[#171717] uppercase">
                      {selectedVehicle.helmet_status}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F7F6]">
                    <span className="text-[10px] text-[#6F7070] block">Seatbelt</span>
                    <span className="font-extrabold text-[#171717] uppercase">
                      {selectedVehicle.seatbelt_status}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#6F7070] space-y-1">
                  <p>
                    <strong>Camera / Video Feed:</strong> {selectedVehicle.source_video}
                  </p>
                  <p>
                    <strong>Trajectory Window:</strong> {selectedVehicle.first_seen_timestamp} &rarr;{" "}
                    {selectedVehicle.last_seen_timestamp}
                  </p>
                </div>
              </div>

              {/* Detected Violations Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                  Violations Breakdown:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedVehicle.violations.map((vl, vi) => (
                    <span
                      key={vi}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase bg-red-100 text-red-800 border border-red-200 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>{vl.replace(/_/g, " ")}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRawJsonVehicle(selectedVehicle);
                    setShowRawJsonModal(true);
                  }}
                  className="text-xs font-mono gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Inspect Raw FastAPI JSON</span>
                </Button>

                <Button
                  onClick={() => setSelectedVehicle(null)}
                  className="bg-[#171717] hover:bg-[#333333] text-white text-xs px-5 rounded-full"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: RAW FASTAPI JSON FOR INDIVIDUAL VEHICLE                          */}
        {/* ========================================================================= */}
        {showRawJsonModal && rawJsonVehicle && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-[#171717] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#333333] space-y-4 max-h-[85vh] flex flex-col text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-mono font-bold text-white">
                    Raw FastAPI Output &mdash; Vehicle #{rawJsonVehicle.number_plate} (Track #{rawJsonVehicle.track_id})
                  </h3>
                </div>

                <button
                  onClick={() => setShowRawJsonModal(false)}
                  className="w-7 h-7 rounded-full bg-[#262626] hover:bg-[#333333] flex items-center justify-center text-[#999999]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto rounded-xl bg-[#0F0F0F] p-4 border border-[#262626]">
                <pre className="text-[11px] font-mono text-[#D4D4D4] whitespace-pre-wrap">
                  {JSON.stringify(rawJsonVehicle.raw_fastapi || rawJsonVehicle, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#8C8C8C] font-mono">
                  Sourced from FastAPI /pipeline/dangerous-vehicles
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(rawJsonVehicle.raw_fastapi || rawJsonVehicle, null, 2)
                      )
                    }
                    className="text-xs bg-[#262626] text-white hover:bg-[#333333] border-[#404040] gap-1.5"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setShowRawJsonModal(false)}
                    className="text-xs bg-white text-[#171717] hover:bg-gray-100 font-semibold"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: FULL RAW FASTAPI PIPELINE JSON INSPECTOR                         */}
        {/* ========================================================================= */}
        {showFullRawModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-[#171717] rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-[#333333] space-y-4 max-h-[90vh] flex flex-col text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Full FastAPI Multi-Model Pipeline Output
                    </h3>
                    <p className="text-xs text-[#8C8C8C]">
                      Deterministic neural outputs across all 6 CCTV streams and 412 analyzed vehicles.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFullRawModal(false)}
                  className="w-8 h-8 rounded-full bg-[#262626] hover:bg-[#333333] flex items-center justify-center text-[#999999]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto rounded-2xl bg-[#0F0F0F] p-4 border border-[#262626] font-mono text-[11px] text-[#A6E22E]">
                <pre className="text-[11px] text-[#E6DB74] whitespace-pre-wrap">
                  {JSON.stringify(data?.rawFastApiOutputs || data, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#8C8C8C] font-mono">
                  Full JSON Payload ({data?.totalAnalyzed || 0} vehicles)
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(data?.rawFastApiOutputs || data, null, 2))
                    }
                    className="text-xs bg-[#262626] text-white hover:bg-[#333333] border-[#404040] gap-1.5"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? "Copied" : "Copy Complete JSON"}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setShowFullRawModal(false)}
                    className="text-xs bg-white text-[#171717] hover:bg-gray-100 font-semibold px-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
