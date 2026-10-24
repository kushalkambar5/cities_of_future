"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileView } from "@/components/dashboard/ProfileView";

export default function PoliceProfilePage() {
  return (
    <DashboardLayout expectedRole="POLICE">
      <ProfileView />
    </DashboardLayout>
  );
}
