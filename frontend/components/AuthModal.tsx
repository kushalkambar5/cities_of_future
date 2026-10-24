"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signInApi, signUpApi, setAuthSession, User } from "@/lib/api";
import { ShieldCheck, UserCheck, Lock, Mail, Phone, User as UserIcon, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = "signin",
}: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<"CITIZEN" | "POLICE" | "ADMIN">("CITIZEN");

  const handleRoleRedirect = (user: User) => {
    onClose();
    if (user.role === "POLICE") {
      router.push("/police/dashboard");
    } else if (user.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/citizen/dashboard");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await signInApi({
        email: signInEmail,
        password: signInPassword,
      });

      if (res.data) {
        setAuthSession(res.data.token, res.data.user);
        handleRoleRedirect(res.data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await signUpApi({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        phone: signUpPhone || undefined,
        role: signUpRole,
      });

      if (res.data) {
        setAuthSession(res.data.token, res.data.user);
        handleRoleRedirect(res.data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Logins for evaluation
  const handleQuickDemoLogin = async (role: "CITIZEN" | "POLICE" | "ADMIN") => {
    setLoading(true);
    setErrorMessage(null);

    const demoCredentials = {
      CITIZEN: {
        email: "citizen_demo@navanagar.gov.in",
        password: "password123",
        name: "Rahul Sharma (Citizen)",
        phone: "+91 98765 43210",
      },
      POLICE: {
        email: "police_demo@navanagar.gov.in",
        password: "password123",
        name: "Officer Vikram (Traffic Police)",
        phone: "+91 98111 22334",
      },
      ADMIN: {
        email: "admin_demo@navanagar.gov.in",
        password: "password123",
        name: "Anand Verma (City Admin)",
        phone: "+91 98222 33445",
      },
    }[role];

    try {
      // First try signing in
      try {
        const res = await signInApi({
          email: demoCredentials.email,
          password: demoCredentials.password,
        });
        if (res.data) {
          setAuthSession(res.data.token, res.data.user);
          handleRoleRedirect(res.data.user);
          return;
        }
      } catch {
        // If demo user does not exist yet, register them
        const res = await signUpApi({
          name: demoCredentials.name,
          email: demoCredentials.email,
          password: demoCredentials.password,
          phone: demoCredentials.phone,
          role,
        });
        if (res.data) {
          setAuthSession(res.data.token, res.data.user);
          handleRoleRedirect(res.data.user);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-7">
        <DialogHeader className="text-center sm:text-center items-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/logo.png"
              alt="Navanagar Logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl object-contain bg-white border border-[#E5E5E5]"
            />
            <span className="font-extrabold text-lg text-[#171717] tracking-tight">
              Navanagar
            </span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-[#171717]">
            {activeTab === "signin" ? "Welcome Back" : "Create an Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6F7070]">
            Access your role-specific dashboard for smart traffic safety.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Shadcn Tabs Component */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as "signin" | "signup");
            setErrorMessage(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* SIGN IN TAB */}
          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="signin-email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="pl-9"
                  />
                  <Mail className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="pl-9"
                  />
                  <Lock className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 font-semibold"
              >
                {loading ? "Authenticating..." : "Sign In to Dashboard"}
              </Button>
            </form>

            {/* Quick Demo Logins for Evaluation */}
            <div className="pt-3 border-t border-[#F0F0F0] text-center">
              <span className="text-[11px] text-[#999999] font-medium block mb-2">
                Quick Demo Accounts (1-Click Access):
              </span>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDemoLogin("CITIZEN")}
                  disabled={loading}
                  className="text-[11px] bg-[#DCE9C5]/50 text-[#2D4C13] hover:bg-[#DCE9C5]"
                >
                  Citizen
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDemoLogin("POLICE")}
                  disabled={loading}
                  className="text-[11px] bg-[#BAE2EF]/50 text-[#171717] hover:bg-[#BAE2EF]"
                >
                  Police Officer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDemoLogin("ADMIN")}
                  disabled={loading}
                  className="text-[11px] bg-[#F2B29A]/50 text-[#5C2718] hover:bg-[#F2B29A]"
                >
                  City Admin
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* SIGN UP TAB */}
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1 text-left">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <Input
                    id="signup-name"
                    required
                    placeholder="Rahul Sharma"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="pl-9"
                  />
                  <UserIcon className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <Label htmlFor="signup-email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="pl-9"
                  />
                  <Mail className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <Label htmlFor="signup-phone">Phone Number (for WhatsApp notices)</Label>
                <div className="relative">
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="pl-9"
                  />
                  <Phone className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <Label htmlFor="signup-password">Password (min 6 chars)</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="pl-9"
                  />
                  <Lock className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1 text-left">
                <Label>Account Role</Label>
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {(
                    [
                      { id: "CITIZEN", label: "Citizen" },
                      { id: "POLICE", label: "Police" },
                      { id: "ADMIN", label: "Admin" },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSignUpRole(r.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        signUpRole === r.id
                          ? "bg-[#171717] text-white border-[#171717]"
                          : "bg-[#F7F7F6] text-[#6F7070] border-[#E5E5E5] hover:bg-[#EAEAEA]"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 font-semibold"
              >
                {loading ? "Creating Account..." : "Create Account & Go to Dashboard"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
