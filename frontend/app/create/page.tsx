"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  getStoredUser, 
  getTrafficLightsApi, 
  createTrafficLightApi, 
  deleteTrafficLightApi,
  getCamerasApi, 
  createCameraApi, 
  deleteCameraApi,
  TrafficLight, 
  Camera 
} from "@/lib/api";
import { UnifiedAsset } from "@/components/map/Admin3DMap";
import { 
  Plus, 
  Trash2, 
  Crosshair, 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Compass,
  Link as LinkIcon
} from "lucide-react";

// Dynamically import map component to ensure client-only execution with WebGL
const Admin3DMap = dynamic(() => import("@/components/map/Admin3DMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[550px] rounded-3xl bg-[#07101d] flex flex-col items-center justify-center text-slate-300 gap-3 border border-[#E5E5E5]">
      <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      <p className="text-xs font-semibold">Initializing OpenFreeMap 3D WebGL Engine...</p>
    </div>
  ),
});

export default function AdminCreateInfrastructurePage() {
  const router = useRouter();

  // State
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Asset creation form state
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [assetType, setAssetType] = useState<"traffic-light" | "camera">("traffic-light");
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  
  // Camera specific state
  const [connectedTrafficLightId, setConnectedTrafficLightId] = useState("");
  const [speedLimit, setSpeedLimit] = useState("50");
  const [cameraStatus, setCameraStatus] = useState<"ACTIVE" | "INACTIVE" | "MAINTENANCE">("ACTIVE");

  // Map picking state
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pendingCoordinate, setPendingCoordinate] = useState<{ lat: number; lng: number } | null>(null);

  // Focus & search
  const [focusedAsset, setFocusedAsset] = useState<UnifiedAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<"all" | "traffic-light" | "camera">("all");

  // Check auth user
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role !== "ADMIN") {
      console.warn("User role is not ADMIN, but page is open in preview mode.");
    }
  }, []);

  // Fetch existing infrastructure from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tlRes, camRes] = await Promise.all([
        getTrafficLightsApi().catch(() => ({ data: [] })),
        getCamerasApi().catch(() => ({ data: [] })),
      ]);
      setTrafficLights(tlRes.data || []);
      setCameras(camRes.data || []);
    } catch (err: any) {
      console.error("Failed to load infrastructure data:", err);
      setStatusMessage({
        type: "error",
        text: "Could not fetch existing traffic lights and cameras from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle location picked from 3D map click
  const handleLocationPicked = (coordinate: { lat: number; lng: number }) => {
    setPendingCoordinate(coordinate);
    setLatitude(coordinate.lat.toFixed(6));
    setLongitude(coordinate.lng.toFixed(6));
    setIsPickingLocation(false);
    setStatusMessage({
      type: "success",
      text: `Captured map coordinates: ${coordinate.lat.toFixed(6)}, ${coordinate.lng.toFixed(6)}`,
    });
  };

  // Start map picking mode
  const startMapPicking = () => {
    setIsPickingLocation(true);
    setStatusMessage({
      type: "success",
      text: "Click anywhere on the 3D map to choose the exact coordinates.",
    });
  };

  const cancelMapPicking = () => {
    setIsPickingLocation(false);
  };

  // Snap to selected traffic light location helper
  const handleSnapToSelectedTrafficLight = () => {
    if (!connectedTrafficLightId) return;
    const tl = trafficLights.find((item) => item.id === connectedTrafficLightId);
    if (tl) {
      // Place camera with a slight natural 10-meter offset
      const offsetLat = tl.latitude + 0.00012;
      const offsetLng = tl.longitude + 0.00015;
      setLatitude(offsetLat.toFixed(6));
      setLongitude(offsetLng.toFixed(6));
      setPendingCoordinate({ lat: offsetLat, lng: offsetLng });
      setStatusMessage({
        type: "success",
        text: `Coordinates positioned alongside Traffic Light '${tl.name}'.`,
      });
    }
  };

  // Submit asset creation to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setStatusMessage({ type: "error", text: "Please provide a valid latitude (-90 to 90)." });
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setStatusMessage({ type: "error", text: "Please provide a valid longitude (-180 to 180)." });
      return;
    }
    if (!formName.trim()) {
      setStatusMessage({ type: "error", text: "Asset name is required." });
      return;
    }

    setSubmitting(true);
    try {
      if (assetType === "traffic-light") {
        const res = await createTrafficLightApi({
          id: formId.trim() || undefined,
          name: formName.trim(),
          latitude: lat,
          longitude: lng,
        });

        const created = res.data;
        setTrafficLights((prev) => [created, ...prev]);
        setStatusMessage({
          type: "success",
          text: `Traffic Light '${created.name}' (${created.id}) created and saved in database!`,
        });

        // Set focused asset to fly to it
        setFocusedAsset({
          id: created.id,
          name: created.name,
          latitude: created.latitude,
          longitude: created.longitude,
          type: "traffic-light",
          raw: created,
        });
      } else {
        // Camera creation
        const parsedSpeed = parseInt(speedLimit, 10) || 50;
        const res = await createCameraApi({
          id: formId.trim() || undefined,
          name: formName.trim(),
          latitude: lat,
          longitude: lng,
          speedLimit: parsedSpeed,
          trafficLightId: connectedTrafficLightId ? connectedTrafficLightId : null,
          status: cameraStatus,
        });

        const created = res.data;
        setCameras((prev) => [created, ...prev]);
        setStatusMessage({
          type: "success",
          text: `CCTV Camera '${created.name}' (${created.id}) created and linked successfully!`,
        });

        // Set focused asset to fly to it
        setFocusedAsset({
          id: created.id,
          name: created.name,
          latitude: created.latitude,
          longitude: created.longitude,
          type: "camera",
          raw: created,
        });
      }

      // Reset form fields
      setFormId("");
      setFormName("");
      setLatitude("");
      setLongitude("");
      setPendingCoordinate(null);
    } catch (err: any) {
      console.error("Submission error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to create asset. Check backend logs.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete asset with cascade confirmation for Traffic Light
  const handleDeleteAsset = async (id: string, type: "traffic-light" | "camera") => {
    if (type === "traffic-light") {
      const connected = cameras.filter((c) => c.trafficLightId === id);
      const tl = trafficLights.find((t) => t.id === id);
      const tlName = tl ? tl.name : id;

      let confirmMessage = `Are you sure you want to delete traffic light '${tlName}' (${id})?`;
      if (connected.length > 0) {
        confirmMessage = 
          `⚠️ WARNING: Deleting Traffic Light '${tlName}' (${id}) will ALSO permanently delete all ${connected.length} connected CCTV camera(s):\n\n` +
          connected.map((c) => `  • ${c.name} (${c.id})`).join("\n") +
          `\n\nDo you want to proceed with deleting the traffic light and its connected camera(s)?`;
      }

      if (!window.confirm(confirmMessage)) {
        return;
      }

      try {
        await deleteTrafficLightApi(id);
        // Cascade remove from frontend state
        setTrafficLights((prev) => prev.filter((item) => item.id !== id));
        setCameras((prev) => prev.filter((item) => item.trafficLightId !== id));

        if (
          focusedAsset?.id === id || 
          (focusedAsset?.type === "camera" && (focusedAsset.raw as Camera)?.trafficLightId === id)
        ) {
          setFocusedAsset(null);
        }

        setStatusMessage({
          type: "success",
          text: `Traffic light '${tlName}' and ${connected.length} connected CCTV camera(s) deleted from database.`,
        });
      } catch (err: any) {
        console.error("Delete failed:", err);
        setStatusMessage({
          type: "error",
          text: err.message || "Failed to delete traffic light.",
        });
      }
    } else {
      const cam = cameras.find((c) => c.id === id);
      const camName = cam ? cam.name : id;

      if (!window.confirm(`Are you sure you want to delete CCTV camera '${camName}' (${id})?`)) {
        return;
      }

      try {
        await deleteCameraApi(id);
        setCameras((prev) => prev.filter((item) => item.id !== id));
        if (focusedAsset?.id === id) {
          setFocusedAsset(null);
        }
        setStatusMessage({
          type: "success",
          text: `Camera '${camName}' deleted from database.`,
        });
      } catch (err: any) {
        console.error("Delete failed:", err);
        setStatusMessage({
          type: "error",
          text: err.message || "Failed to delete camera.",
        });
      }
    }
  };

  // Filtered list for Tab 2
  const filteredAssets = useMemo(() => {
    const list: UnifiedAsset[] = [];
    if (listFilter === "all" || listFilter === "traffic-light") {
      trafficLights.forEach((tl) => {
        list.push({
          id: tl.id,
          name: tl.name,
          latitude: tl.latitude,
          longitude: tl.longitude,
          type: "traffic-light",
          raw: tl,
        });
      });
    }
    if (listFilter === "all" || listFilter === "camera") {
      cameras.forEach((c) => {
        list.push({
          id: c.id,
          name: c.name,
          latitude: c.latitude,
          longitude: c.longitude,
          type: "camera",
          raw: c,
        });
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [trafficLights, cameras, listFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex flex-col text-[#171717]">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-full hover:bg-[#F7F7F6] text-[#6F7070] hover:text-[#171717] transition-all border border-transparent hover:border-[#E5E5E5]"
            title="Return to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Image
            src="/logo.png"
            alt="Navanagar Logo"
            width={34}
            height={34}
            className="w-8 h-8 rounded-xl object-contain bg-white border border-[#E5E5E5]"
          />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-[#171717]">
                Navanagar 3D Command Map
              </h1>
            </div>
            <p className="text-[11px] text-[#6F7070]">
              Deploy and configure real-time 3D traffic lights and CCTV monitoring cameras
            </p>
          </div>
        </div>

        {/* Quick Stats & Action */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 bg-[#F7F7F6] px-3 py-1.5 rounded-full border border-[#E5E5E5]">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-[#171717]">{trafficLights.length}</span>
            <span className="text-[#6F7070]">Traffic Lights</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#F7F7F6] px-3 py-1.5 rounded-full border border-[#E5E5E5]">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-semibold text-[#171717]">{cameras.length}</span>
            <span className="text-[#6F7070]">CCTV Cameras</span>
          </div>

          <Link
            href="/admin/dashboard"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#171717] text-white hover:bg-[#333333] transition-all"
          >
            Exit to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Workspace: Left Controls & Right 3D Map */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 max-w-[1720px] w-full mx-auto">
        {/* Left Side: Control Panel (Form + List) */}
        <div className="w-full lg:w-[440px] shrink-0 flex flex-col gap-4">
          {/* Tabs: Deploy New Asset vs Placed Assets */}
          <div className="bg-white p-1.5 rounded-2xl border border-[#E5E5E5] flex gap-1 shadow-soft">
            <button
              onClick={() => setActiveTab("form")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "form"
                  ? "bg-[#171717] text-white shadow-xs"
                  : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Asset</span>
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "list"
                  ? "bg-[#171717] text-white shadow-xs"
                  : "text-[#6F7070] hover:text-[#171717] hover:bg-[#F7F7F6]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Items ({trafficLights.length + cameras.length})</span>
            </button>
          </div>

          {/* Feedback banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border transition-all ${
                statusMessage.type === "success"
                  ? "bg-[#DCE9C5] text-[#2D4C13] border-[#8CB64A]/30"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#8CB64A]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-[11px] font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: FORM */}
          {activeTab === "form" && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E5E5] shadow-soft flex flex-col gap-5">
              {/* Asset Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7070] mb-2">
                  Select Infrastructure Type
                </label>
                <div className="grid grid-cols-2 gap-2.5 p-1 bg-[#F7F7F6] rounded-2xl border border-[#E5E5E5]">
                  <button
                    type="button"
                    onClick={() => {
                      setAssetType("traffic-light");
                      setStatusMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                      assetType === "traffic-light"
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "text-[#6F7070] hover:text-[#171717]"
                    }`}
                  >
                    <span>🚦</span>
                    <span>Traffic Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssetType("camera");
                      setStatusMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                      assetType === "camera"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                        : "text-[#6F7070] hover:text-[#171717]"
                    }`}
                  >
                    <span>📷</span>
                    <span>CCTV Camera</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
                {/* Location Selection Section */}
                <div className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#E5E5E5] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-[#171717] block">Deployment Coordinates</span>
                      <span className="text-[11px] text-[#6F7070]">
                        Click on map or type manual coordinates
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={isPickingLocation ? cancelMapPicking : startMapPicking}
                      className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all text-xs ${
                        isPickingLocation
                          ? "bg-rose-500 text-white animate-pulse"
                          : "bg-sky-500 text-white hover:bg-sky-600"
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>{isPickingLocation ? "Cancel Pick" : "Pick on Map"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F7070] uppercase mb-1">
                        Latitude (N)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="12.914100"
                        value={latitude}
                        onChange={(e) => {
                          setLatitude(e.target.value);
                          const latVal = Number(e.target.value);
                          const lngVal = Number(longitude);
                          if (!isNaN(latVal) && !isNaN(lngVal) && lngVal !== 0) {
                            setPendingCoordinate({ lat: latVal, lng: lngVal });
                          }
                        }}
                        required
                        className="w-full h-9 px-3 rounded-xl bg-white border border-[#E5E5E5] text-[#171717] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F7070] uppercase mb-1">
                        Longitude (E)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="74.856000"
                        value={longitude}
                        onChange={(e) => {
                          setLongitude(e.target.value);
                          const latVal = Number(latitude);
                          const lngVal = Number(e.target.value);
                          if (!isNaN(latVal) && !isNaN(lngVal) && latVal !== 0) {
                            setPendingCoordinate({ lat: latVal, lng: lngVal });
                          }
                        }}
                        required
                        className="w-full h-9 px-3 rounded-xl bg-white border border-[#E5E5E5] text-[#171717] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                      />
                    </div>
                  </div>
                </div>

                {/* Name & ID Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#171717] mb-1">
                      {assetType === "traffic-light" ? "Traffic Light Name" : "Camera Name"} *
                    </label>
                    <input
                      type="text"
                      placeholder={
                        assetType === "traffic-light"
                          ? "e.g. Hampankatta Main Circle"
                          : "e.g. Approach Northbound Cam 1"
                      }
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full h-10 px-3.5 rounded-xl bg-[#F7F7F6] border border-[#E5E5E5] text-[#171717] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#171717] mb-1">
                      Identifier (ID) <span className="text-[#999999] font-normal">(Optional, auto-generated if left blank)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={assetType === "traffic-light" ? "e.g. TL-01" : "e.g. CCTV-01"}
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#F7F7F6] border border-[#E5E5E5] text-[#171717] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                    />
                  </div>
                </div>

                {/* Camera Specific Fields: Connected Traffic Light & Speed Limit */}
                {assetType === "camera" && (
                  <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-200 space-y-3.5">
                    {/* CONNECTED TRAFFIC LIGHT (As explicitly requested by user) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                          <LinkIcon className="w-3 h-3 text-purple-600" />
                          <span>Connected Traffic Light</span>
                        </label>
                        {connectedTrafficLightId && (
                          <button
                            type="button"
                            onClick={handleSnapToSelectedTrafficLight}
                            className="text-[10px] text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                          >
                            Snap coords near TL
                          </button>
                        )}
                      </div>

                      <select
                        value={connectedTrafficLightId}
                        onChange={(e) => setConnectedTrafficLightId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-purple-200 text-[#171717] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">None / Standalone (No connected traffic light)</option>
                        {trafficLights.map((tl) => (
                          <option key={tl.id} value={tl.id}>
                            🚦 {tl.id} — {tl.name}
                          </option>
                        ))}
                      </select>

                      {trafficLights.length === 0 ? (
                        <p className="text-[10px] text-amber-700 mt-1.5 flex items-center gap-1">
                          <span>💡</span>
                          <span>No traffic lights exist yet. You can create one first or deploy this camera standalone.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-purple-700 mt-1">
                          Linking a camera to a traffic light enables synchronized stop-line red light detection.
                        </p>
                      )}
                    </div>

                    {/* Speed Limit & Status */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
                          Speed Limit (km/h)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="160"
                          value={speedLimit}
                          onChange={(e) => setSpeedLimit(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-white border border-purple-200 text-[#171717] font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
                          Camera Status
                        </label>
                        <select
                          value={cameraStatus}
                          onChange={(e) => setCameraStatus(e.target.value as any)}
                          className="w-full h-9 px-2 rounded-xl bg-white border border-purple-200 text-[#171717] font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 px-4 rounded-2xl font-extrabold text-white text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    submitting
                      ? "bg-slate-400 cursor-not-allowed"
                      : assetType === "traffic-light"
                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                      : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/25"
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>
                    {submitting
                      ? "Deploying Asset to Database..."
                      : assetType === "traffic-light"
                      ? "Save Traffic Light & Render in 3D"
                      : "Save CCTV Camera & Render in 3D"}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ACTIVE ASSETS LIST */}
          {activeTab === "list" && (
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] shadow-soft flex flex-col gap-4 max-h-[650px]">
              {/* Search and Filters */}
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F7F7F6] border border-[#E5E5E5] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#54A8BD]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex gap-1.5 text-[11px] font-bold">
                  <button
                    onClick={() => setListFilter("all")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      listFilter === "all"
                        ? "bg-[#171717] text-white"
                        : "bg-[#F7F7F6] text-[#6F7070] hover:text-[#171717]"
                    }`}
                  >
                    All ({trafficLights.length + cameras.length})
                  </button>
                  <button
                    onClick={() => setListFilter("traffic-light")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      listFilter === "traffic-light"
                        ? "bg-amber-500 text-white"
                        : "bg-[#F7F7F6] text-[#6F7070] hover:text-[#171717]"
                    }`}
                  >
                    Traffic Lights ({trafficLights.length})
                  </button>
                  <button
                    onClick={() => setListFilter("camera")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      listFilter === "camera"
                        ? "bg-purple-600 text-white"
                        : "bg-[#F7F7F6] text-[#6F7070] hover:text-[#171717]"
                    }`}
                  >
                    Cameras ({cameras.length})
                  </button>
                </div>
              </div>

              {/* Items Scrollable List */}
              <div className="overflow-y-auto space-y-2 pr-1">
                {filteredAssets.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6F7070]">
                    <p className="font-semibold text-[#171717]">No infrastructure items found</p>
                    <p className="text-[11px] mt-1">Switch to the Deploy tab to place your first 3D asset.</p>
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const isCamera = asset.type === "camera";
                    const cam = isCamera ? (asset.raw as Camera) : null;
                    const isFocused = focusedAsset?.id === asset.id;

                    return (
                      <div
                        key={asset.id}
                        className={`p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
                          isFocused
                            ? "border-sky-500 bg-sky-50/60 shadow-xs"
                            : "border-[#E5E5E5] bg-[#F7F7F6] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 overflow-hidden">
                          <span className="text-base select-none mt-0.5">
                            {isCamera ? "📷" : "🚦"}
                          </span>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[10px] text-slate-500">
                                {asset.id}
                              </span>
                              <span className="font-bold text-[#171717] truncate">
                                {asset.name}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-[#6F7070] mt-0.5">
                              {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}
                            </p>
                            {isCamera && cam?.trafficLightId && (
                              <p className="text-[10px] text-purple-700 font-semibold mt-0.5 truncate">
                                ↳ TL: {cam.trafficLightName || cam.trafficLightId}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setFocusedAsset(asset)}
                            className="p-1.5 rounded-xl text-sky-700 hover:bg-sky-100 transition-colors"
                            title="Focus in 3D View"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.type)}
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors"
                            title={
                              asset.type === "traffic-light"
                                ? "Delete Traffic Light and any connected CCTV cameras"
                                : "Delete CCTV Camera"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: 3D Map Stage with definite flex-1 height */}
        <div className="flex-1 flex flex-col h-[calc(100vh-125px)] min-h-[580px]">
          <Admin3DMap
            trafficLights={trafficLights}
            cameras={cameras}
            isPickingLocation={isPickingLocation}
            pendingCoordinate={pendingCoordinate}
            onLocationPicked={handleLocationPicked}
            onCancelPick={cancelMapPicking}
            focusedAsset={focusedAsset}
            onDeleteAsset={handleDeleteAsset}
          />
        </div>
      </div>
    </div>
  );
}
