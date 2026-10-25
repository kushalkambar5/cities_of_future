"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  ShieldCheck, 
  BadgeCheck,
  PlayCircle,
  FileText,
  AlertTriangle
} from "lucide-react";
import { getStoredUser, clearAuthSession, User as UserType } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TrafficChatWidget } from "./TrafficChatWidget";

interface DashboardLayoutProps {
  children: React.ReactNode;
  expectedRole: "CITIZEN" | "POLICE" | "ADMIN";
}

export function DashboardLayout({
  children,
  expectedRole,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const rolePrefix = expectedRole.toLowerCase();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      // If not logged in, redirect to home
      router.push("/");
      return;
    }

    if (user.role !== expectedRole) {
      // If logged in with different role, take them to their role's dashboard
      router.push(`/${user.role.toLowerCase()}/dashboard`);
      return;
    }

    setCurrentUser(user);
    setLoading(false);
  }, [expectedRole, router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-[#6F7070]">
          <span className="w-2 h-2 rounded-full bg-[#171717] animate-ping" />
          <span>Loading Navanagar Dashboard...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: "Dashboard",
      href: `/${rolePrefix}/dashboard`,
      icon: LayoutDashboard,
      active: pathname === `/${rolePrefix}/dashboard`,
    },
    ...(expectedRole === "ADMIN"
      ? [
          {
            label: "3D Infrastructure",
            href: "/create",
            icon: ShieldCheck,
            active: pathname === "/create" || pathname === "/admin/create",
          },
          {
            label: "AI Video Simulation",
            href: "/simulate",
            icon: PlayCircle,
            active: pathname === "/simulate" || pathname === "/admin/simulate",
          },
          {
            label: "Violations & Fines",
            href: "/admin/violations",
            icon: FileText,
            active: pathname === "/admin/violations" || pathname === "/violations",
          },
          {
            label: "Dangerous Vehicles",
            href: "/admin/dangerous-vehicles",
            icon: AlertTriangle,
            active: pathname === "/admin/dangerous-vehicles",
          },
        ]
      : []),
    ...(expectedRole === "CITIZEN"
      ? [
          {
            label: "My Violations & Fines",
            href: "/citizen/violations",
            icon: FileText,
            active: pathname === "/citizen/violations",
          },
        ]
      : []),
    ...(expectedRole === "POLICE"
      ? [
          {
            label: "Traffic Violations",
            href: "/police/violations",
            icon: FileText,
            active: pathname === "/police/violations",
          },
        ]
      : []),
    {
      label: "Profile",
      href: `/${rolePrefix}/profile`,
      icon: User,
      active: pathname === `/${rolePrefix}/profile`,
    },
  ];

  const roleBadgeVariants = {
    CITIZEN: "green",
    POLICE: "blue",
    ADMIN: "peach",
  } as const;

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex flex-col md:flex-row text-[#171717]">
      {/* 
        Sidebar Only (No Navbar as requested: 
        "where there should be sidebar, not a navbar in the sidebar for now only give the dashboard, profile options only for now")
      */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E5E5E5] p-5 flex flex-col justify-between shrink-0 shadow-soft select-none">
        <div>
          {/* Brand Logo & Role */}
          <div className="flex items-center gap-2.5 pb-6 border-b border-[#F0F0F0]">
            <Image
              src="/logo.png"
              alt="Navanagar Logo"
              width={38}
              height={38}
              className="w-9 h-9 rounded-xl object-contain bg-white border border-[#E5E5E5]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#171717]">
                  Navanagar
                </span>
              </div>
              <Badge
                variant={roleBadgeVariants[expectedRole]}
                className="text-[9px] uppercase tracking-wider px-2 py-0 mt-0.5"
              >
                {expectedRole} PORTAL
              </Badge>
            </div>
          </div>

          {/* Simple Navigation: Only Dashboard & Profile */}
          <nav className="mt-6 flex flex-col gap-1.5" aria-label="Dashboard Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-[#171717] text-white shadow-xs"
                      : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Button */}
        <div className="pt-6 border-t border-[#F0F0F0] flex flex-col gap-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-[#BAE2EF] text-[#171717] flex items-center justify-center font-bold text-xs uppercase">
              {currentUser?.name.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-[#171717] block truncate">
                {currentUser?.name}
              </span>
              <span className="text-[11px] text-[#6F7070] block truncate">
                {currentUser?.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-full text-xs font-semibold text-[#6F7070] hover:text-red-600 hover:bg-red-50 transition-all text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-6xl overflow-y-auto">
        {children}
      </main>

      {/* Role-Aware OpenAI Agent SDK Chatbot */}
      <TrafficChatWidget user={currentUser} role={expectedRole} />
    </div>
  );
}
