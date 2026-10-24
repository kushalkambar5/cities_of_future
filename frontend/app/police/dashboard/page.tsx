"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getStoredUser } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ShieldCheck, CheckCircle2, XCircle, Search, AlertTriangle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PoliceDashboardPage() {
  const user = getStoredUser();
  const [verifiedIncidents, setVerifiedIncidents] = useState<Record<string, "APPROVED" | "REJECTED">>({});
  const [searchPlate, setSearchPlate] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const incidents = [
    {
      id: "INC-8901",
      camera: "CCTV-03",
      location: "MG Road Junction",
      plate: "KA01AB1234",
      speed: "87 km/h",
      limit: "60 km/h",
      violation: "Red Light Crossing + Speeding",
      confidence: "94.2%",
      time: "10:42 AM",
    },
    {
      id: "INC-8902",
      camera: "CCTV-02",
      location: "Indiranagar 100ft Road",
      plate: "MH02EE9012",
      speed: "44 km/h",
      limit: "50 km/h",
      violation: "Missing Helmet",
      confidence: "96.5%",
      time: "10:38 AM",
    },
  ];

  const handleVerify = (id: string, action: "APPROVED" | "REJECTED") => {
    setVerifiedIncidents((prev) => ({
      ...prev,
      [id]: action,
    }));
  };

  const handleSearchVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPlate.trim().toUpperCase() === "KA01AB1234") {
      setSearchResult("Owner: Rahul Sharma (Honda City) • 1 Active Violation Pending (₹1,000)");
    } else {
      setSearchResult(`Registration ${searchPlate.toUpperCase()}: Spotless record, 0 active violations.`);
    }
  };

  return (
    <DashboardLayout expectedRole="POLICE">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              Traffic Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
              Officer On Duty: {user?.name || "Traffic Police"} • Real-Time AI Detection Stream
            </p>
          </div>

          <Badge variant="blue" className="self-start sm:self-auto py-1 px-3 text-xs">
            ● 12 Intersections Active
          </Badge>
        </div>

        {/* 3 Police Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Active Intersections
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">12 Nodes</div>
            <p className="text-xs text-[#8CB64A] mt-1 font-semibold">100% Online &amp; Recording</p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              AI Detections Today
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">47 Events</div>
            <p className="text-xs text-[#6F7070] mt-1">Speed, Red Light, Helmet</p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Pending Verification
            </span>
            <div className="text-2xl font-extrabold text-[#E07A5F]">
              {2 - Object.keys(verifiedIncidents).length} Pending
            </div>
            <p className="text-xs text-[#6F7070] mt-1">Officer approval required</p>
          </Card>
        </div>

        {/* Rapid Vehicle History Lookup */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[#171717] mb-2">
            Rapid Vehicle Plate Check
          </h3>
          <form onSubmit={handleSearchVehicle} className="flex gap-2">
            <Input
              placeholder="Enter Plate (e.g. KA01AB1234)..."
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              className="max-w-md uppercase tracking-wider text-xs font-semibold"
            />
            <Button type="submit" size="sm">
              <Search className="w-3.5 h-3.5 mr-1" /> Search
            </Button>
          </form>

          {searchResult && (
            <div className="mt-3 p-3 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] text-xs font-medium text-[#171717]">
              {searchResult}
            </div>
          )}
        </Card>

        {/* Officer Verification Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Flagged Incident Review Queue</CardTitle>
            <CardDescription>
              Review optical AI evidence and confirm or dismiss notices with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {incidents.map((inc) => {
              const status = verifiedIncidents[inc.id];
              return (
                <div
                  key={inc.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#171717]">
                          {inc.id}
                        </span>
                        <Badge variant="peach">{inc.violation}</Badge>
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-[#E5E5E5]">
                          {inc.plate}
                        </span>
                      </div>
                      <p className="text-xs text-[#6F7070] mt-1">
                        {inc.camera} • {inc.location} • {inc.time}
                      </p>
                      <p className="text-xs text-[#6F7070] mt-0.5">
                        Speed: <strong className="text-red-600">{inc.speed}</strong> (Limit: {inc.limit}) •{" "}
                        <span className="text-[#54A8BD] font-medium">AI Conf: {inc.confidence}</span>
                      </p>
                    </div>

                    <div>
                      {status === "APPROVED" && (
                        <Badge variant="green" className="py-1 px-3">
                          ✓ Verified (Fine Issued)
                        </Badge>
                      )}
                      {status === "REJECTED" && (
                        <Badge variant="secondary" className="py-1 px-3 text-[#6F7070]">
                          ✕ Dismissed by Officer
                        </Badge>
                      )}
                      {!status && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerify(inc.id, "APPROVED")}
                            className="bg-[#171717] text-white hover:bg-[#333333]"
                          >
                            ✓ Approve Notice
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleVerify(inc.id, "REJECTED")}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
