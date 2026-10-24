"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Video,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Camera,
  FolderOpen,
  MapPin,
  Gauge,
  Sliders,
  Sparkles,
  UploadCloud,
  Check,
  Send
} from "lucide-react";
import {
  getSimulationCamerasApi,
  assignCameraVideoApi,
  runSimulationApi,
  SimulationCameraItem,
  SimulationProcessResponse,
} from "@/lib/api";

export default function AdminSimulatePage() {
  const [cameras, setCameras] = useState<SimulationCameraItem[]>([]);
  const [loadingCams, setLoadingCams] = useState(true);
  const [cameraVideoPaths, setCameraVideoPaths] = useState<Record<string, string>>({});
  const [speedLimits, setSpeedLimits] = useState<Record<string, number>>({});
  const [dragOverCam, setDragOverCam] = useState<string | null>(null);

  // Simulation execution state
  const [simulating, setSimulating] = useState(false);
  const [simProgressMsg, setSimProgressMsg] = useState("");
  const [resultsByCam, setResultsByCam] = useState<Record<string, SimulationProcessResponse>>({});
  const [activeCamResultId, setActiveCamResultId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "fines" | "vehicles" | "json">("video");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    setLoadingCams(true);
    try {
      const res = await getSimulationCamerasApi();
      if (res.success && res.cameras) {
        setCameras(res.cameras);
        const paths: Record<string, string> = {};
        const limits: Record<string, number> = {};

        res.cameras.forEach((c) => {
          if (c.assignedVideo?.filePath) {
            paths[c.id] = c.assignedVideo.filePath;
          } else if (c.suggestedPath) {
            paths[c.id] = c.suggestedPath;
          }
          limits[c.id] = c.speedLimit || 60;
        });

        setCameraVideoPaths(paths);
        setSpeedLimits(limits);
      }
    } catch (err: any) {
      console.error("Failed to load CCTV cameras:", err);
      setErrorMsg("Failed to connect to backend to load CCTV cameras.");
    } finally {
      setLoadingCams(false);
    }
  };

  const handleUpdatePath = async (cameraId: string, newPath: string) => {
    setCameraVideoPaths((prev) => ({ ...prev, [cameraId]: newPath }));
    try {
      await assignCameraVideoApi({
        cameraId,
        filePath: newPath,
      });
    } catch (e) {
      // Background sync
    }
  };

  const handleDrop = (e: React.DragEvent, cameraId: string) => {
    e.preventDefault();
    setDragOverCam(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const candidatePath = (file as any).path || `C:\\Users\\kusha\\Downloads\\dfhsd\\CCTV videos\\${file.name}`;
      handleUpdatePath(cameraId, candidatePath);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, cameraId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const candidatePath = (file as any).path || `C:\\Users\\kusha\\Downloads\\dfhsd\\CCTV videos\\${file.name}`;
      handleUpdatePath(cameraId, candidatePath);
    }
  };

  const handleRunSimulation = async (targetCamId?: string) => {
    const camsToRun = targetCamId
      ? cameras.filter((c) => c.id === targetCamId)
      : cameras.filter((c) => !!cameraVideoPaths[c.id]);

    if (camsToRun.length === 0) {
      setErrorMsg("Please assign a local video file path to at least one CCTV camera.");
      return;
    }

    setSimulating(true);
    setErrorMsg(null);

    const newResults: Record<string, SimulationProcessResponse> = { ...resultsByCam };

    for (let i = 0; i < camsToRun.length; i++) {
      const cam = camsToRun[i];
      const filePath = cameraVideoPaths[cam.id];
      const speed = speedLimits[cam.id] || cam.speedLimit || 60;

      setSimProgressMsg(
        `[${i + 1}/${camsToRun.length}] Processing ${cam.id} (${cam.name}) via FastAPI multi-model pipeline...`
      );

      try {
        const response = await runSimulationApi({
          cameraId: cam.id,
          filePath,
          speedLimit: speed,
        });

        newResults[cam.id] = response;
        setResultsByCam({ ...newResults });
        if (!activeCamResultId) {
          setActiveCamResultId(cam.id);
        }
      } catch (err: any) {
        console.error(`Simulation failed for camera ${cam.id}:`, err);
        setErrorMsg(`Simulation failed on camera ${cam.id}: ${err.message}`);
        break;
      }
    }

    if (camsToRun.length > 0 && !activeCamResultId) {
      setActiveCamResultId(camsToRun[0].id);
    }

    setSimulating(false);
    setSimProgressMsg("");
  };

  const currentResult = activeCamResultId ? resultsByCam[activeCamResultId] : null;

  // Compute aggregate metrics
  const totalViolationsAll = Object.values(resultsByCam).reduce(
    (acc, r) => acc + (r.enforcement?.totalViolations || 0),
    0
  );
  const totalVehiclesAll = Object.values(resultsByCam).reduce(
    (acc, r) => acc + (r.mlOutput?.totalVehiclesDetected || 0),
    0
  );
  const totalFinesIssued = Object.values(resultsByCam).reduce(
    (acc, r) =>
      acc +
      (r.enforcement?.fines?.reduce((s, f) => s + f.fineAmount, 0) || 0),
    0
  );

  return (
    <DashboardLayout expectedRole="ADMIN">
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E5] shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] text-white text-xs font-semibold mb-3">
                <Camera className="w-3.5 h-3.5 text-[#BAE2EF]" />
                <span>MULTI-CCTV SURVEILLANCE & AI ENFORCEMENT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                CCTV Video Simulation Command Center
              </h1>
              <p className="text-xs sm:text-sm text-[#6F7070] mt-1.5 max-w-3xl leading-relaxed">
                Assign and drag-and-drop local video files for all existing city CCTV cameras. Run the integrated FastAPI neural pipeline on local paths directly, stream processed videos back to Cloudflare R2, generate fine notices, and dispatch automated WhatsApp E-Challans.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={fetchCameras}
                disabled={simulating}
                className="p-2.5 rounded-full border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#6F7070] hover:text-[#171717] transition-all"
                title="Refresh Cameras"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRunSimulation()}
                disabled={simulating || cameras.length === 0}
                className={`py-2.5 px-5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all ${
                  simulating
                    ? "bg-[#6F7070] text-white cursor-not-allowed"
                    : "bg-[#171717] hover:bg-black text-white hover:scale-[1.02]"
                }`}
              >
                {simulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#BAE2EF]" />
                    <span>Processing Cameras...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#BAE2EF] fill-current" />
                    <span>Simulate All CCTV Cameras</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Global Progress Bar */}
        {simulating && (
          <div className="p-4 rounded-2xl bg-[#171717] text-white border border-[#333] shadow-md flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-[#BAE2EF] shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-mono font-bold block text-[#BAE2EF]">
                AI PIPELINE IN PROGRESS
              </span>
              <span className="text-xs text-[#D1D1D1] block mt-0.5">{simProgressMsg}</span>
            </div>
          </div>
        )}

        {/* Section 1: All CCTV Cameras Grid */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-base font-bold text-[#171717]">
                Existing CCTV Cameras ({cameras.length})
              </h2>
              <p className="text-xs text-[#6F7070]">
                Drag and drop or assign video footage to each camera before initiating simulation.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#54A8BD] bg-[#BAE2EF]/20 px-3 py-1 rounded-full">
              {Object.keys(cameraVideoPaths).filter((k) => !!cameraVideoPaths[k]).length} of {cameras.length} Ready
            </span>
          </div>

          {loadingCams ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5E5]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#171717] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#6F7070]">Loading CCTV Infrastructure...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cameras.map((cam) => {
                const assignedPath = cameraVideoPaths[cam.id] || "";
                const isDragOver = dragOverCam === cam.id;
                const hasResult = !!resultsByCam[cam.id];
                const isSelectedForView = activeCamResultId === cam.id;

                return (
                  <div
                    key={cam.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCam(cam.id);
                    }}
                    onDragLeave={() => setDragOverCam(null)}
                    onDrop={(e) => handleDrop(e, cam.id)}
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                      isDragOver
                        ? "border-[#54A8BD] bg-[#BAE2EF]/10 ring-2 ring-[#54A8BD]"
                        : isSelectedForView
                        ? "border-[#171717] shadow-md ring-1 ring-[#171717]"
                        : "border-[#E5E5E5] shadow-soft hover:border-[#D1D1D1]"
                    }`}
                  >
                    <div>
                      {/* Card Top: Camera Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F0F0F0]">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#171717] text-white font-mono text-[10px] font-bold">
                              {cam.id}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-green-700 uppercase">
                              {cam.status}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-[#171717] mt-1 line-clamp-1">
                            {cam.name}
                          </h3>
                        </div>

                        {hasResult && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EFEFEF] text-[#171717] flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-green-600" />
                            <span>Simulated</span>
                          </span>
                        )}
                      </div>

                      {/* Location & Speed Limit */}
                      <div className="flex items-center justify-between text-[11px] text-[#6F7070] my-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {cam.latitude?.toFixed(4)}, {cam.longitude?.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-[#171717]">
                          <Gauge className="w-3.5 h-3.5 text-[#54A8BD]" />
                          <span>Limit:</span>
                          <input
                            type="number"
                            value={speedLimits[cam.id] || cam.speedLimit || 60}
                            onChange={(e) =>
                              setSpeedLimits((prev) => ({
                                ...prev,
                                [cam.id]: Number(e.target.value),
                              }))
                            }
                            className="w-12 bg-[#F5F5F5] text-center border border-[#E5E5E5] rounded px-1 py-0.5 text-[11px] font-bold"
                          />
                          <span>km/h</span>
                        </div>
                      </div>

                      {/* Drag & Drop Video File Box */}
                      <input
                        type="file"
                        accept="video/mp4,video/*"
                        id={`file-input-${cam.id}`}
                        className="hidden"
                        onChange={(e) => handleFileInput(e, cam.id)}
                      />
                      <div
                        onClick={() => document.getElementById(`file-input-${cam.id}`)?.click()}
                        className={`rounded-2xl p-4 text-center cursor-pointer transition-all border-2 border-dashed ${
                          assignedPath
                            ? "border-green-300 bg-green-50/60 hover:bg-green-50"
                            : "border-[#D1D1D1] bg-[#FAFAFA] hover:bg-[#F3F3F3]"
                        }`}
                      >
                        <UploadCloud
                          className={`w-7 h-7 mx-auto mb-1.5 ${
                            assignedPath ? "text-green-600" : "text-[#8C8C8C]"
                          }`}
                        />
                        <span className="text-xs font-bold text-[#171717] block">
                          Upload Demo Video
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action for this Camera */}
                    <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
                      {hasResult ? (
                        <button
                          type="button"
                          onClick={() => setActiveCamResultId(cam.id)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                            isSelectedForView
                              ? "bg-[#171717] text-white"
                              : "bg-[#EFEFEF] text-[#171717] hover:bg-[#E5E5E5]"
                          }`}
                        >
                          <Video className="w-3 h-3" />
                          <span>View Results</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8C8C8C]">Pending Simulation</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRunSimulation(cam.id)}
                        disabled={simulating || !assignedPath}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                          !assignedPath || simulating
                            ? "bg-[#EFEFEF] text-[#8C8C8C] cursor-not-allowed"
                            : "bg-[#171717] hover:bg-black text-white"
                        }`}
                      >
                        <Play className="w-3 h-3 text-[#BAE2EF] fill-current" />
                        <span>Simulate {cam.id}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Results & Enforcement Telemetry */}
        {Object.keys(resultsByCam).length > 0 && (
          <div className="space-y-6 pt-4 border-t border-[#E5E5E5]">
            {/* Aggregate Metrics Across All Cameras */}
            <div>
              <h2 className="text-base font-bold text-[#171717] mb-3">
                Simulation Telemetry & Enforcement Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider block">
                    Cameras Simulated
                  </span>
                  <span className="text-xl font-extrabold text-[#171717] mt-1 block">
                    {Object.keys(resultsByCam).length} of {cameras.length}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider block">
                    Vehicles Tracked
                  </span>
                  <span className="text-xl font-extrabold text-[#171717] mt-1 block">
                    {totalVehiclesAll}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider block">
                    Violations Detected
                  </span>
                  <span className="text-xl font-extrabold text-red-600 mt-1 block">
                    {totalViolationsAll}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider block">
                    Total Fines Issued
                  </span>
                  <span className="text-xl font-extrabold text-[#171717] mt-1 block">
                    ₹{totalFinesIssued.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] shadow-xs">
                  <span className="text-[10px] font-bold text-[#6F7070] uppercase tracking-wider block">
                    Processed Videos in R2
                  </span>
                  <span className="text-xl font-extrabold text-green-600 mt-1 block">
                    {Object.values(resultsByCam).filter((r) => !!r.mlOutput?.outputVideoR2Key).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Camera Results Selector Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-[#6F7070] uppercase tracking-wider shrink-0 mr-2">
                View Camera Results:
              </span>
              {Object.keys(resultsByCam).map((cId) => (
                <button
                  key={cId}
                  onClick={() => setActiveCamResultId(cId)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeCamResultId === cId
                      ? "bg-[#171717] text-white shadow-xs"
                      : "bg-white text-[#6F7070] border border-[#E5E5E5] hover:border-[#171717]"
                  }`}
                >
                  {cId} Results ({resultsByCam[cId].enforcement?.totalViolations || 0} violations)
                </button>
              ))}
            </div>

            {/* Active Camera Detailed Results Card */}
            {currentResult && (
              <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-soft overflow-hidden">
                {/* Result Header & Tabs */}
                <div className="border-b border-[#F0F0F0] px-6 pt-5 bg-[#FAFAFA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#171717] text-white font-mono text-xs font-bold">
                          {activeCamResultId}
                        </span>
                        <h3 className="text-base font-extrabold text-[#171717]">
                          Neural Detection Telemetry & Enforcement Feed
                        </h3>
                      </div>
                      <p className="text-xs text-[#6F7070] mt-0.5">
                        Frames: {currentResult.mlOutput?.totalFrames} | Vehicles:{" "}
                        {currentResult.mlOutput?.totalVehiclesDetected} | Violations:{" "}
                        {currentResult.enforcement?.totalViolations}
                      </p>
                    </div>

                    {currentResult.mlOutput?.outputVideoUrl && (
                      <a
                        href={currentResult.mlOutput.outputVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#171717] hover:underline shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Stream R2 Video in New Window</span>
                      </a>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("video")}
                      className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                        activeTab === "video"
                          ? "border-[#171717] text-[#171717] bg-white"
                          : "border-transparent text-[#6F7070] hover:text-[#171717]"
                      }`}
                    >
                      Annotated R2 Video
                    </button>
                    <button
                      onClick={() => setActiveTab("fines")}
                      className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                        activeTab === "fines"
                          ? "border-[#171717] text-[#171717] bg-white"
                          : "border-transparent text-[#6F7070] hover:text-[#171717]"
                      }`}
                    >
                      Fines & WhatsApp Notices ({currentResult.enforcement?.fines?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("vehicles")}
                      className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                        activeTab === "vehicles"
                          ? "border-[#171717] text-[#171717] bg-white"
                          : "border-transparent text-[#6F7070] hover:text-[#171717]"
                      }`}
                    >
                      All Vehicles ({currentResult.mlOutput?.vehicles?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("json")}
                      className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                        activeTab === "json"
                          ? "border-[#171717] text-[#171717] bg-white"
                          : "border-transparent text-[#6F7070] hover:text-[#171717]"
                      }`}
                    >
                      FastAPI Raw Output
                    </button>
                  </div>
                </div>

                {/* Tab 1: Video Player */}
                {activeTab === "video" && (
                  <div className="p-6">
                    <div className="rounded-2xl overflow-hidden bg-black aspect-video relative flex items-center justify-center border border-[#E5E5E5]">
                      <video
                        key={currentResult.mlOutput?.outputVideoUrl}
                        src={currentResult.mlOutput?.outputVideoUrl || currentResult.mlOutput?.annotatedMediaUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {currentResult.mlOutput?.outputVideoR2Key && (
                      <p className="text-[11px] font-mono text-[#6F7070] mt-3">
                        Cloudflare R2 Object Key:{" "}
                        <span className="font-semibold text-[#171717]">
                          {currentResult.mlOutput.outputVideoR2Key}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 2: Fines & WhatsApp Notices */}
                {activeTab === "fines" && (
                  <div className="p-6">
                    {(!currentResult.enforcement?.fines ||
                      currentResult.enforcement.fines.length === 0) ? (
                      <div className="p-8 text-center bg-[#F9F9F9] rounded-2xl border border-dashed border-[#D1D1D1]">
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#171717]">No Violations Detected</p>
                        <p className="text-[11px] text-[#6F7070] mt-0.5">
                          All vehicles on {activeCamResultId} maintained lawful speeds and helmet/safety regulations.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#E5E5E5] text-[10px] font-bold text-[#6F7070] uppercase tracking-wider">
                              <th className="py-3 px-3">Challan No</th>
                              <th className="py-3 px-3">Vehicle Plate</th>
                              <th className="py-3 px-3">Registered Owner</th>
                              <th className="py-3 px-3">Phone</th>
                              <th className="py-3 px-3">Violation Type</th>
                              <th className="py-3 px-3">Penalty (₹)</th>
                              <th className="py-3 px-3">E-Challan PDF</th>
                              <th className="py-3 px-3">WhatsApp Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0F0F0] text-xs">
                            {currentResult.enforcement.fines.map((fine, idx) => {
                              const waTextSuccess = fine.whatsappStatus?.textMessage?.success;
                              const waDocSuccess = fine.whatsappStatus?.documentMessage?.success;
                              const waDelivered = waTextSuccess || waDocSuccess;

                              return (
                                <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors">
                                  <td className="py-3.5 px-3 font-mono font-bold text-[#171717]">
                                    {fine.challanNumber}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <span className="px-2.5 py-1 rounded-md bg-[#171717] text-white text-[11px] font-mono font-bold tracking-wider">
                                      {fine.plateNumber}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 font-semibold text-[#171717]">
                                    {fine.ownerName}
                                  </td>
                                  <td className="py-3.5 px-3 font-mono text-[#6F7070]">
                                    {fine.ownerPhone}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                                      {fine.violationType.replace(/_/g, " ")}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 font-bold text-[#171717]">
                                    ₹{fine.fineAmount.toLocaleString()}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    {fine.pdfUrl ? (
                                      <a
                                        href={fine.pdfUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#54A8BD] hover:underline"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>View PDF</span>
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-[#8C8C8C]">N/A</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    {waDelivered ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        <span>Sent via OpenWA</span>
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"
                                        title={fine.whatsappStatus?.textMessage?.error || "Check OpenWA"}
                                      >
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        <span>{fine.ownerPhone === "N/A" ? "No Phone" : "Dispatched / Timed Out"}</span>
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: All Detected Vehicles */}
                {activeTab === "vehicles" && (
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E5E5E5] text-[10px] font-bold text-[#6F7070] uppercase tracking-wider">
                            <th className="py-3 px-3">Track ID</th>
                            <th className="py-3 px-3">License Plate</th>
                            <th className="py-3 px-3">ANPR Conf</th>
                            <th className="py-3 px-3">Speed</th>
                            <th className="py-3 px-3">Helmet</th>
                            <th className="py-3 px-3">Seatbelt</th>
                            <th className="py-3 px-3">Violations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0] text-xs">
                          {currentResult.mlOutput?.vehicles?.map((v: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors">
                              <td className="py-3 px-3 font-mono text-[#6F7070]">#{v.track_id}</td>
                              <td className="py-3 px-3">
                                <span className="font-mono bg-[#EFEFEF] px-2 py-0.5 rounded text-[11px] font-bold">
                                  {v.number_plate}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-[#6F7070]">
                                {(v.plate_confidence * 100).toFixed(0)}%
                              </td>
                              <td className="py-3 px-3 font-mono font-semibold text-[#171717]">
                                {v.speed_kmh ? `${v.speed_kmh} km/h` : "-"}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    v.helmet_status === "no_helmet"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {v.helmet_status}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    v.seatbelt_status === "no_belt"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {v.seatbelt_status}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {v.violations && v.violations.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {v.violations.map((violation: string, vi: number) => (
                                      <span
                                        key={vi}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 uppercase"
                                      >
                                        {violation}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-green-600 font-semibold">None</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 4: Raw JSON */}
                {activeTab === "json" && (
                  <div className="p-6">
                    <pre className="bg-[#171717] text-white p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px]">
                      {JSON.stringify(currentResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
