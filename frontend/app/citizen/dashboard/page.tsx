"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getStoredUser } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, AlertTriangle, CheckCircle2, ShieldCheck, Eye, Smartphone, Clock, MapPin, Camera } from "lucide-react";

export default function CitizenDashboardPage() {
  const user = getStoredUser();
  const [finePaid, setFinePaid] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <DashboardLayout expectedRole="CITIZEN">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              Welcome back, {user?.name || "Citizen"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
              Track registered vehicles, verified camera notices, and driving safety scores.
            </p>
          </div>

          <Badge variant="green" className="self-start sm:self-auto py-1 px-3 text-xs">
            Safe Driver Score: 84/100
          </Badge>
        </div>

        {/* 3 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Registered Vehicles
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">1 Vehicle</div>
            <p className="text-xs text-[#6F7070] mt-1">KA01AB1234 • Honda City</p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              Pending Fines
            </span>
            <div className="text-2xl font-extrabold text-[#171717]">
              {finePaid ? "₹0" : "₹1,000"}
            </div>
            <p className="text-xs text-[#6F7070] mt-1">
              {finePaid ? "All notices cleared" : "1 Notice Pending (MG Road)"}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] uppercase font-bold text-[#999999] block mb-1">
              WhatsApp Alert Status
            </span>
            <div className="text-2xl font-extrabold text-[#25D366]">Active</div>
            <p className="text-xs text-[#6F7070] mt-1">Linked to {user?.phone || "+91 9876543210"}</p>
          </Card>
        </div>

        {/* Active Violations List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Traffic Notices</CardTitle>
                <CardDescription>
                  Verified camera evidence and instant resolution
                </CardDescription>
              </div>
              <Badge variant={finePaid ? "green" : "peach"}>
                {finePaid ? "0 Pending" : "1 Action Required"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {finePaid ? (
              <div className="p-6 rounded-2xl bg-[#DCE9C5]/40 border border-[#DCE9C5] text-center">
                <CheckCircle2 className="w-9 h-9 text-[#8CB64A] mx-auto mb-2" strokeWidth={2} />
                <h3 className="text-sm font-bold text-[#2D4C13]">
                  All Fines Settled &amp; Verified
                </h3>
                <p className="text-xs text-[#2D4C13]/80 mt-1">
                  Your vehicle record is in good standing. Safe Driver points updated.
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#171717]">
                        Notice #V1023
                      </span>
                      <Badge variant="peach">Red Light &amp; Speeding</Badge>
                    </div>
                    <p className="text-xs text-[#6F7070] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#54A8BD]" />
                      MG Road Junction (CCTV-03) • Today, 10:42 AM
                    </p>
                    <p className="text-xs text-[#6F7070] mt-0.5">
                      Captured Speed: <strong className="text-red-600">87 km/h</strong> (Limit: 60 km/h)
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xl font-extrabold text-[#171717] block">
                      ₹1,000
                    </span>
                    <span className="text-[11px] font-bold text-[#5C2718]">
                      UNPAID
                    </span>
                  </div>
                </div>

                {showEvidence && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E0E0E0] text-xs space-y-2 animate-fadeIn">
                    <div className="flex justify-between font-medium">
                      <span>CCTV Frame Evidence</span>
                      <span className="text-[#54A8BD]">AI Conf: 94.2%</span>
                    </div>
                    <div className="h-28 rounded-lg bg-[#BAE2EF]/30 border border-dashed border-[#54A8BD] flex flex-col items-center justify-center text-center p-2">
                      <Camera className="w-5 h-5 text-[#54A8BD] mb-1" />
                      <span className="font-mono font-bold text-xs text-[#171717]">
                        KA01AB1234 • Virtual Stop Line Crossed at 10:42:13
                      </span>
                      <span className="text-[10px] text-[#6F7070] mt-0.5">
                        Verified by Traffic Police Officer #4208
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EBEBEB]">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="p-0 h-auto font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {showEvidence ? "Hide Camera Proof" : "View Camera Proof"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setFinePaid(true)}
                    className="font-semibold"
                  >
                    Mark Payment Done (Simulate)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
