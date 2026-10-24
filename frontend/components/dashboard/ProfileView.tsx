"use client";

import React, { useState } from "react";
import { getStoredUser, updateProfileApi, setAuthSession, getStoredToken, User } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Mail, Phone, Calendar, Shield, CheckCircle2, AlertCircle } from "lucide-react";

export function ProfileView() {
  const user = getStoredUser();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await updateProfileApi({ name, phone });
      if (res.data?.user) {
        const token = getStoredToken();
        if (token) {
          setAuthSession(token, res.data.user);
        }
        setSuccessMessage("Profile updated successfully!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#6F7070] mt-1">
          Manage your account information and contact preferences.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-[#DCE9C5]/50 border border-[#8CB64A]/40 text-[#2D4C13] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#8CB64A] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Overview Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Verified system profile information</CardDescription>
            </div>
            <Badge variant="blue" className="uppercase text-[10px] tracking-wider">
              {user?.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5]">
              <span className="text-[10px] text-[#999999] uppercase font-bold block mb-1">
                Account Status
              </span>
              <span className="font-bold text-[#2D4C13] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CB64A]" />
                {user?.status || "ACTIVE"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5]">
              <span className="text-[10px] text-[#999999] uppercase font-bold block mb-1">
                Registered Email
              </span>
              <span className="font-semibold text-[#171717] truncate block">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleUpdate} className="space-y-4 pt-3 border-t border-[#F5F5F5]">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">WhatsApp Notification Phone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
              <p className="text-[11px] text-[#999999]">
                Used for instant delivery of verifiable violation photo notices.
              </p>
            </div>

            <Button type="submit" disabled={saving} className="font-semibold">
              {saving ? "Saving Changes..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
