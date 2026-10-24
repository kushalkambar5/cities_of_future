"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getStoredUser } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, ArrowRight } from "lucide-react";

export default function CitizenDashboardPage() {
  const user = getStoredUser();

  return (
    <DashboardLayout expectedRole="CITIZEN">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              Citizen Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
              Welcome back, {user?.name || "Citizen"} 👋
            </p>
          </div>

          <Badge variant="green" className="self-start sm:self-auto py-1 px-3 text-xs">
            Citizen Portal
          </Badge>
        </div>

        {/* Clean, Simple Overview Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#BAE2EF] flex items-center justify-center text-[#171717]">
              <ShieldCheck className="w-5 h-5 text-[#54A8BD]" strokeWidth={2} />
            </div>
            <div>
              <CardTitle className="text-lg">Citizen Account Overview</CardTitle>
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
              <span className="text-[#6F7070]">Phone Number</span>
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

          <p className="text-xs text-[#6F7070] mt-6 leading-relaxed">
            Welcome to your citizen dashboard. When violations or notifications are generated for your registered vehicles, they will appear here with full video and photographic proof.
          </p>

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
      </div>
    </DashboardLayout>
  );
}
