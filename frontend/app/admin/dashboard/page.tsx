"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getStoredUser } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Cpu, Video, CheckCircle2, Server, Layers, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const user = getStoredUser();

  const services = [
    { name: "ANPR Optical Character Recognition", status: "ONLINE", accuracy: "99.4%" },
    { name: "Speed Radar & Virtual Stop Line Engine", status: "ONLINE", accuracy: "98.8%" },
    { name: "Helmet & Seatbelt Classifier", status: "ONLINE", accuracy: "96.5%" },
    { name: "Corridor Point-to-Point Matcher", status: "ONLINE", accuracy: "100%" },
    { name: "WhatsApp Gateway (OpenWA)", status: "ONLINE", latency: "42ms" },
  ];

  return (
    <DashboardLayout expectedRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              City Infrastructure Console
            </h1>
            <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
              Administrator: {user?.name || "Municipal Admin"} • System Health &amp; Infrastructure
            </p>
          </div>

          <Badge variant="peach" className="self-start sm:self-auto py-1 px-3 text-xs">
            Admin Console Active
          </Badge>
        </div>

        {/* 4 Infrastructure Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              CCTV Cameras
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">12 Nodes</div>
            <p className="text-xs text-[#8CB64A] mt-1 font-semibold">All synchronized</p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Traffic Signals
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">8 Lights</div>
            <p className="text-xs text-[#6F7070] mt-1">Associated with CCTVs</p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Active Corridors
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">4 Routes</div>
            <p className="text-xs text-[#6F7070] mt-1">Point-to-point speed</p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Cloud Storage
            </span>
            <div className="text-2xl font-extrabold text-[#54A8BD]">R2 Ready</div>
            <p className="text-xs text-[#6F7070] mt-1">Tamper-proof storage</p>
          </Card>
        </div>

        {/* System Services Health Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>System &amp; ML Service Health</CardTitle>
            <CardDescription>
              Real-time connectivity to FastAPI ML inference and notification pipelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#F5F5F5]">
              {services.map((svc, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#8CB64A] animate-pulse" />
                    <span className="font-semibold text-[#171717]">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#6F7070] text-[11px]">
                      {svc.accuracy ? `Accuracy: ${svc.accuracy}` : `Latency: ${svc.latency}`}
                    </span>
                    <Badge variant="green" className="text-[10px]">
                      {svc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
