"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getStoredUser } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, ArrowRight, Layers, MapPin } from "lucide-react";

export default function AdminDashboardPage() {
  const user = getStoredUser();

  return (
    <DashboardLayout expectedRole="ADMIN">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
              Welcome back, {user?.name || "Administrator"}
            </p>
          </div>

          <Badge variant="peach" className="self-start sm:self-auto py-1 px-3 text-xs">
            Admin Console
          </Badge>
        </div>

        {/* 3D Infrastructure Command Card */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-white via-white to-[#F7F7F6] border-2 border-[#54A8BD]/20 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#BAE2EF] flex items-center justify-center text-[#171717] shrink-0 shadow-xs">
                <MapPin className="w-6 h-6 text-[#54A8BD]" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">3D Infrastructure Creator</CardTitle>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BAE2EF] text-[#171717] uppercase tracking-wider">
                    Route: /create
                  </span>
                </div>
                <CardDescription className="mt-1 text-xs">
                  Place 3D traffic lights and CCTV monitoring cameras directly onto the interactive 3D map. Supports click-to-deploy or manual coordinate inputs.
                </CardDescription>
              </div>
            </div>

            <Button asChild className="bg-[#171717] hover:bg-[#333333] text-white shrink-0 self-start sm:self-auto rounded-full px-5 py-2.5">
              <Link href="/create" className="inline-flex items-center gap-2 text-xs font-bold">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Open 3D Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Clean, Simple Overview Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#BAE2EF] flex items-center justify-center text-[#171717]">
              <ShieldCheck className="w-5 h-5 text-[#54A8BD]" strokeWidth={2} />
            </div>
            <div>
              <CardTitle className="text-lg">City Administration</CardTitle>
              <CardDescription>
                Navanagar Smart Traffic &amp; Safety Platform
              </CardDescription>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
              <span className="text-[#6F7070]">Logged in as</span>
              <span className="font-semibold text-[#171717]">
                {user?.name} ({user?.email})
              </span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
              <span className="text-[#6F7070]">Assigned Role</span>
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

          <p className="text-xs text-[#6F7070] mt-6 leading-relaxed">
            Welcome to your administrative dashboard. You can manage your account information and preferences from your Profile.
          </p>

          <div className="mt-6 pt-5 border-t border-[#F5F5F5] flex items-center justify-between">
            <span className="text-xs text-[#999999]">Need to update your details?</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/profile" className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Go to Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
