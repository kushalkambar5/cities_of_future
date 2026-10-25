"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { TrafficLight, Camera } from "@/lib/api";
import { 
  Compass, 
  Layers, 
  Crosshair, 
  X
} from "lucide-react";

export interface UnifiedAsset {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: "traffic-light" | "camera";
  raw: TrafficLight | Camera;
}

interface Admin3DMapProps {
  trafficLights: TrafficLight[];
  cameras: Camera[];
  isPickingLocation: boolean;
  pendingCoordinate: { lat: number; lng: number } | null;
  onLocationPicked: (coordinate: { lat: number; lng: number }) => void;
  onCancelPick: () => void;
  focusedAsset: UnifiedAsset | null;
  onDeleteAsset: (id: string, type: "traffic-light" | "camera") => void;
}

const DEFAULT_CENTER = {
  lng: 74.856,
  lat: 12.9141,
  zoom: 15.5,
  pitch: 60,
  bearing: -18,
};

const MODEL_CONFIGS = {
  camera: {
    modelPath: "/camera_pole.glb",
    targetHeight: 20.0, // Scaled for visible 3D rendering
    axis: "Y" as const,
  },
  "traffic-light": {
    modelPath: "/stylized_traffic_light.glb",
    targetHeight: 18.0, // Scaled for visible 3D rendering
    axis: "Z" as const,
  },
};

export default function Admin3DMap({
  trafficLights,
  cameras,
  isPickingLocation,
  pendingCoordinate,
  onLocationPicked,
  onCancelPick,
  focusedAsset,
}: Admin3DMapProps) {
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const modelCacheRef = useRef<Map<string, Promise<any>>>(new Map());
  const assetModelLayerRef = useRef<any>(null);
  const selectionMarkerRef = useRef<any>(null);
  const activePopupRef = useRef<any>(null);
  const assetMarkersRef = useRef<Map<string, any>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [show3dBuildings, setShow3dBuildings] = useState(true);

  // Convert traffic lights and cameras into unified list for the 3D layer
  const unifiedAssets: UnifiedAsset[] = [
    ...trafficLights.map((tl) => ({
      id: tl.id,
      name: tl.name,
      latitude: tl.latitude,
      longitude: tl.longitude,
      type: "traffic-light" as const,
      raw: tl,
    })),
    ...cameras.map((c) => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      type: "camera" as const,
      raw: c,
    })),
  ];

  // Sync 3D assets to Three.js layer whenever list changes
  useEffect(() => {
    if (assetModelLayerRef.current && mapLoaded) {
      assetModelLayerRef.current.syncAssets(unifiedAssets);
    }
  }, [unifiedAssets, mapLoaded]);

  // Handle map cursor when isPickingLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isPickingLocation ? "crosshair" : "";
  }, [isPickingLocation]);

  // Update selection marker when pendingCoordinate changes
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;

    if (pendingCoordinate) {
      if (!selectionMarkerRef.current) {
        const markerEl = document.createElement("div");
        markerEl.className = "coordinate-picker-marker";
        markerEl.setAttribute("aria-label", "Selected deployment point");
        selectionMarkerRef.current = new maplibregl.Marker({ element: markerEl, anchor: "center" })
          .setLngLat([pendingCoordinate.lng, pendingCoordinate.lat])
          .addTo(map);
      } else {
        selectionMarkerRef.current.setLngLat([pendingCoordinate.lng, pendingCoordinate.lat]);
      }
    } else if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }
  }, [pendingCoordinate]);

  // Focus asset with smooth 3D camera flight and interactive popup
  const flyToAsset = useCallback((asset: UnifiedAsset) => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;

    map.flyTo({
      center: [asset.longitude, asset.latitude],
      zoom: 19.5,
      pitch: 65,
      bearing: -20,
      duration: 1200,
      essential: true,
    });

    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }

    window.setTimeout(() => {
      const currentMap = mapRef.current;
      if (!currentMap) return;

      const popupDiv = document.createElement("div");
      popupDiv.className = "text-xs space-y-2 select-none text-[#171717] min-w-[200px]";

      const isCamera = asset.type === "camera";
      const cam = isCamera ? (asset.raw as Camera) : null;
      const typeBadgeColor = isCamera 
        ? "bg-purple-100 text-purple-800 border-purple-200" 
        : "bg-amber-100 text-amber-800 border-amber-200";
      const typeLabel = isCamera ? "CCTV CAMERA" : "TRAFFIC LIGHT";

      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-3 border-b border-[#E5E5E5] pb-2 pr-6">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${typeBadgeColor}">
            ${typeLabel}
          </span>
          <span class="font-mono text-[11px] font-bold text-[#6F7070]">
            ${asset.id}
          </span>
        </div>
        <div class="pt-1.5 space-y-1">
          <h4 class="font-bold text-sm text-[#171717] leading-snug">${asset.name}</h4>
          ${isCamera && cam?.trafficLightId ? `
            <p class="text-[11px] text-[#6F7070]">
              🚦 Linked TL: <span class="font-semibold text-[#171717]">${cam.trafficLightName || cam.trafficLightId}</span>
            </p>
          ` : ''}
          ${isCamera && cam ? `
            <p class="text-[11px] text-[#6F7070]">
              ⚡ Speed Limit: <span class="font-semibold text-emerald-700">${cam.speedLimit} km/h</span>
            </p>
            <p class="text-[11px] text-[#6F7070]">
              ● Status: <span class="font-semibold text-emerald-700">${cam.status}</span>
            </p>
          ` : ''}
          <div class="mt-2.5 pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#999999] font-mono gap-4">
            <span>Lat: ${asset.latitude.toFixed(6)}</span>
            <span>Lng: ${asset.longitude.toFixed(6)}</span>
          </div>
        </div>
      `;

      activePopupRef.current = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
      })
        .setLngLat([asset.longitude, asset.latitude])
        .setDOMContent(popupDiv)
        .addTo(currentMap);
    }, 600);
  }, []);

  // Synchronize HTML interactive markers for each asset
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !mapLoaded) return;

    const currentMarkers = assetMarkersRef.current;
    const incomingIds = new Set(unifiedAssets.map((a) => a.id));

    // Remove obsolete markers
    for (const [id, marker] of currentMarkers.entries()) {
      if (!incomingIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    unifiedAssets.forEach((asset) => {
      if (currentMarkers.has(asset.id)) {
        currentMarkers.get(asset.id).setLngLat([asset.longitude, asset.latitude]);
      } else {
        const isCamera = asset.type === "camera";
        const el = document.createElement("div");
        el.className = `asset-map-marker group cursor-pointer select-none transition-transform hover:scale-110`;
        
        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg border ${
              isCamera 
                ? "border-purple-300 text-purple-950 shadow-purple-500/10" 
                : "border-amber-300 text-amber-950 shadow-amber-500/10"
            }">
              <span class="w-2.5 h-2.5 rounded-full ${isCamera ? "bg-purple-500" : "bg-amber-500"} animate-pulse"></span>
              <span class="font-bold text-xs tracking-tight">${isCamera ? "📷" : "🚦"} ${asset.name || asset.id}</span>
            </div>
            <div class="w-2.5 h-2.5 bg-white rotate-45 -mt-1.5 border-r border-b ${
              isCamera ? "border-purple-300" : "border-amber-300"
            }"></div>
            <div class="w-2 h-2 rounded-full ${isCamera ? "bg-purple-600" : "bg-amber-600"} mt-0.5 shadow-md ring-2 ring-white"></div>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          flyToAsset(asset);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom", offset: [0, -4] })
          .setLngLat([asset.longitude, asset.latitude])
          .addTo(map);

        currentMarkers.set(asset.id, marker);
      }
    });
  }, [unifiedAssets, mapLoaded, flyToAsset]);

  // Fit bounds to all assets
  const fitAllAssets = useCallback(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || unifiedAssets.length === 0) return;

    if (unifiedAssets.length === 1) {
      flyToAsset(unifiedAssets[0]);
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    unifiedAssets.forEach((a) => bounds.extend([a.longitude, a.latitude]));

    map.fitBounds(bounds, {
      padding: { top: 70, bottom: 90, left: 70, right: 70 },
      maxZoom: 17,
      duration: 1200,
    });
  }, [unifiedAssets, flyToAsset]);

  // Whenever focusedAsset prop changes, fly to it
  useEffect(() => {
    if (focusedAsset && mapLoaded) {
      flyToAsset(focusedAsset);
    }
  }, [focusedAsset, mapLoaded, flyToAsset]);

  // Initialize MapLibre and Three.js 3D custom layer
  useEffect(() => {
    let cancelled = false;
    let mapInstance: any = null;
    let resizeObserver: ResizeObserver | null = null;

    async function initMap() {
      try {
        const [maplibreModule, threeModule, gltfModule, skeletonUtilsModule] =
          await Promise.all([
            import("maplibre-gl"),
            import("three"),
            import("three/addons/loaders/GLTFLoader.js"),
            import("three/addons/utils/SkeletonUtils.js"),
          ]);

        if (cancelled || !mapContainerRef.current) return;

        const maplibregl: any = (maplibreModule as any).default ?? maplibreModule;
        const THREE: any = threeModule;
        const GLTFLoader: any = (gltfModule as any).GLTFLoader;
        const cloneModel: any = (skeletonUtilsModule as any).clone ?? (skeletonUtilsModule as any).default?.clone;

        if (!GLTFLoader || !cloneModel) {
          throw new Error("Three.js loaders could not be initialized.");
        }

        maplibreRef.current = maplibregl;

        // Set worker URL to the local public worker
        maplibregl.setWorkerUrl(
          new URL("/maplibre-gl-worker.mjs", window.location.origin).toString()
        );

        const assetModelLayer = createAssetModelLayer({
          maplibregl,
          THREE,
          GLTFLoader,
          cloneModel,
          modelCache: modelCacheRef.current,
        });
        assetModelLayerRef.current = assetModelLayer;

        mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
          zoom: DEFAULT_CENTER.zoom,
          pitch: DEFAULT_CENTER.pitch,
          bearing: DEFAULT_CENTER.bearing,
          maxPitch: 75,
          attributionControl: false,
        });
        mapRef.current = mapInstance;
        if (typeof window !== "undefined") {
          (window as any).__debugMap = mapInstance;
          (window as any).__debugLayer = assetModelLayer;
        }

        // Controls
        mapInstance.addControl(
          new maplibregl.NavigationControl({ visualizePitch: true }),
          "bottom-right"
        );
        mapInstance.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          "bottom-left"
        );

        // Click handler for location picking
        mapInstance.on("click", (e: any) => {
          onLocationPicked({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });

        // Trigger repaint on map movements
        mapInstance.on("move", () => {
          mapInstance.triggerRepaint();
        });

        mapInstance.on("load", () => {
          if (cancelled) return;
          setMapLoaded(true);

          // Force full-bleed resize so no black borders appear
          mapInstance.resize();

          // Auto-fit to existing assets if present so the view is never empty
          if (unifiedAssets.length > 0) {
            window.setTimeout(() => {
              if (unifiedAssets.length === 1) {
                mapInstance.flyTo({
                  center: [unifiedAssets[0].longitude, unifiedAssets[0].latitude],
                  zoom: 17,
                  pitch: 60,
                });
              } else {
                const bounds = new maplibregl.LngLatBounds();
                unifiedAssets.forEach((a) => bounds.extend([a.longitude, a.latitude]));
                mapInstance.fitBounds(bounds, {
                  padding: { top: 80, bottom: 90, left: 70, right: 70 },
                  maxZoom: 17,
                  duration: 800,
                });
              }
            }, 300);
          }

          // Enable 3D buildings layer if available
          if (mapInstance.getLayer("building-3d")) {
            mapInstance.setLayoutProperty("building-3d", "visibility", "visible");
          }

          // Add custom Three.js layer
          try {
            mapInstance.addLayer(assetModelLayer);
            assetModelLayer.syncAssets(unifiedAssets);
          } catch (err) {
            console.error("Could not add 3D custom layer:", err);
          }
        });

        // Setup ResizeObserver on outer container to ensure 100% canvas resize
        if (outerContainerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            if (mapInstance) {
              mapInstance.resize();
            }
          });
          resizeObserver.observe(outerContainerRef.current);
        }

        // Additional safeguard resizes after layout settles
        window.setTimeout(() => mapInstance?.resize(), 150);
        window.setTimeout(() => mapInstance?.resize(), 600);
      } catch (err: any) {
        console.error("Map initialization failed:", err);
        if (!cancelled) {
          setMapError(err.message || "Could not load 3D map");
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (activePopupRef.current) activePopupRef.current.remove();
      if (selectionMarkerRef.current) selectionMarkerRef.current.remove();
      for (const marker of assetMarkersRef.current.values()) {
        marker.remove();
      }
      assetMarkersRef.current.clear();
      assetModelLayerRef.current = null;
      maplibreRef.current = null;
      mapRef.current = null;
      mapInstance?.remove();
    };
  }, []);

  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_CENTER.zoom,
      pitch: DEFAULT_CENTER.pitch,
      bearing: DEFAULT_CENTER.bearing,
      duration: 1200,
    });
  };

  const toggleBuildings = () => {
    const map = mapRef.current;
    if (!map) return;
    const nextVal = !show3dBuildings;
    setShow3dBuildings(nextVal);
    if (map.getLayer("building-3d")) {
      map.setLayoutProperty("building-3d", "visibility", nextVal ? "visible" : "none");
    }
  };

  return (
    <div 
      ref={outerContainerRef}
      className="relative w-full h-full min-h-[550px] flex-1 rounded-3xl overflow-hidden border border-[#E5E5E5] bg-[#F7F7F6] shadow-soft"
    >
      {/* Map Canvas Container - Positioned Absolutely to fill 100% of parent */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 w-full h-full" 
        style={{ width: "100%", height: "100%" }}
      />

      {/* Picking Banner (Top Center) */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#171717]/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-sky-400/50 flex items-center gap-3 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <span className="text-xs font-semibold">
            Click anywhere on the 3D map to deploy asset
          </span>
          <button
            onClick={onCancelPick}
            className="p-1 rounded-full hover:bg-white/20 transition-colors ml-1"
            title="Cancel coordinate selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating HUD: Top Left Status */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">

        {/* Selected Coordinates pill if pending */}
        {pendingCoordinate && (
          <div className="bg-sky-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-sky-400/40 text-white shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <div>
                <p className="text-[9px] font-bold uppercase text-sky-300">
                  Target Coordinates
                </p>
                <p className="text-xs font-mono font-bold text-sky-100">
                  {pendingCoordinate.lat.toFixed(6)}, {pendingCoordinate.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <button
              onClick={onCancelPick}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Floating HUD: Top Right Quick Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {unifiedAssets.length > 0 && (
          <button
            onClick={fitAllAssets}
            className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white/95 text-[#171717] hover:bg-white border border-[#E5E5E5] backdrop-blur-md shadow-xs transition-all flex items-center gap-1.5 hover:shadow-sm"
            title="Fit all assets in view"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#54A8BD]" />
            <span>Fit All ({unifiedAssets.length})</span>
          </button>
        )}

        <button
          onClick={toggleBuildings}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-xs ${
            show3dBuildings
              ? "bg-[#171717] text-white border-[#171717]"
              : "bg-white/95 text-[#6F7070] border-[#E5E5E5] hover:bg-white hover:text-[#171717]"
          }`}
          title="Toggle 3D Buildings"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D Buildings</span>
        </button>

        <button
          onClick={resetView}
          className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white/95 text-[#171717] hover:bg-white border border-[#E5E5E5] backdrop-blur-md shadow-xs transition-all flex items-center gap-1.5 hover:shadow-sm"
          title="Reset Camera Angle"
        >
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span>Reset Camera</span>
        </button>
      </div>

      {/* Floating HUD: Bottom Left 3D Asset Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#E5E5E5] text-[#171717] shadow-xs flex items-center gap-3.5 text-xs select-none">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
          <span>Traffic Light ({trafficLights.length})</span>
        </div>
        <div className="h-3 w-[1px] bg-[#E5E5E5]" />
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-2xs" />
          <span>CCTV Camera ({cameras.length})</span>
        </div>
      </div>

      {/* Error Overlay if map fails */}
      {mapError && (
        <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-xs flex items-center justify-center p-6 text-center text-[#171717]">
          <div className="max-w-md bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-lg">
            <p className="text-rose-600 font-bold mb-2">Map Layer Error</p>
            <p className="text-xs text-[#6F7070] mb-4">{mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-[#171717] text-white text-xs font-semibold hover:bg-black"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Three.js Custom MapLibre Layer for Accurate 3D Model Rendering
// ---------------------------------------------------------------------------

function createAssetModelLayer({
  maplibregl,
  THREE,
  GLTFLoader,
  cloneModel,
  modelCache,
}: {
  maplibregl: any;
  THREE: any;
  GLTFLoader: any;
  cloneModel: any;
  modelCache: Map<string, Promise<any>>;
}) {
  return {
    id: "asset-models-3d",
    type: "custom",
    renderingMode: "3d",
    scene: null as any,
    camera: null as any,
    renderer: null as any,
    map: null as any,
    objects: new Map<string, { asset: UnifiedAsset; object: any | null }>(),

    onAdd(mapInstance: any, gl: any) {
      this.map = mapInstance;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // Multi-directional atmospheric lighting so models are never black
      const ambientLight = new THREE.AmbientLight(0xffffff, 3.2);
      
      const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
      sunLight.position.set(1, 1, 2).normalize();

      const fillLight = new THREE.DirectionalLight(0xffffff, 2.0);
      fillLight.position.set(-1, -1, 2).normalize();

      this.scene.add(ambientLight, sunLight, fillLight);

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
      });
      this.renderer.autoClear = false;
      if (THREE.SRGBColorSpace) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      this.renderer.setClearColor(0x000000, 0);

      // Load queued objects
      for (const entry of this.objects.values()) {
        this.loadAsset(entry.asset);
      }
    },

    render(gl: any, renderArgs: any) {
      (this as any).__renderCount = ((this as any).__renderCount || 0) + 1;
      (this as any).__lastRenderArgs = renderArgs;
      if (!this.renderer || !this.scene || !this.camera) return;

      try {
        const matrix = 
          renderArgs?.defaultProjectionData?.mainMatrix ||
          renderArgs?.defaultProjectionData?.fallbackMatrix ||
          (Array.isArray(renderArgs) || renderArgs instanceof Float64Array ? renderArgs : null) || 
          renderArgs?.modelViewProjectionMatrix;

        if (matrix) {
          this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
          this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        }

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);

        // Crucial fix: Three.js enables scissor test and clips WebGL drawing to a sub-rectangle on scaled displays (devicePixelRatio > 1).
        // Restore MapLibre's viewport and disable scissor test so no black straps appear on top/right.
        if (gl) {
          gl.disable(gl.SCISSOR_TEST);
          const canvas = this.map?.getCanvas();
          if (canvas) {
            gl.viewport(0, 0, canvas.width, canvas.height);
          }
        }
      } catch (error) {
        console.error("3D rendering cycle stopped:", error);
      }
    },

    onRemove() {
      this.objects.clear();
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.map = null;
    },

    syncAssets(nextAssets: UnifiedAsset[]) {
      const incomingIds = new Set(nextAssets.map((a) => a.id));

      for (const id of Array.from(this.objects.keys())) {
        if (!incomingIds.has(id)) {
          this.removeAsset(id);
        }
      }

      for (const asset of nextAssets) {
        this.addAsset(asset);
      }
    },

    removeAsset(id: string) {
      const entry = this.objects.get(id);
      if (entry?.object && this.scene) {
        this.scene.remove(entry.object);
      }
      this.objects.delete(id);
      this.map?.triggerRepaint();
    },

    addAsset(asset: UnifiedAsset) {
      const config = MODEL_CONFIGS[asset.type];
      if (!config || this.objects.has(asset.id)) return;

      this.objects.set(asset.id, { asset, object: null });
      if (!this.scene || !this.map) return;
      this.loadAsset(asset);
    },

    loadAsset(asset: UnifiedAsset) {
      const config = MODEL_CONFIGS[asset.type];
      if (!config || !this.scene || !this.map) return;

      loadModelOnce(asset.type, config.modelPath, GLTFLoader, modelCache)
        .then((sourceModel: any) => {
          const current = this.objects.get(asset.id);
          if (!current || !this.scene) return;

          const model = cloneModel(sourceModel);
          positionModelPrecisely(model, asset, config, maplibregl, THREE);
          current.object = model;
          this.scene.add(model);
          this.map?.triggerRepaint();
        })
        .catch((error: any) => {
          console.error(`Unable to load ${asset.type} 3D model`, error);
          this.objects.delete(asset.id);
        });
    },
  };
}

function loadModelOnce(
  type: string,
  modelPath: string,
  GLTFLoader: any,
  modelCache: Map<string, Promise<any>>
): Promise<any> {
  if (modelCache.has(type)) {
    return modelCache.get(type)!;
  }

  const promise = new Promise((resolve, reject) => {
    new GLTFLoader().load(
      modelPath,
      (gltf: any) => resolve(gltf.scene),
      undefined,
      reject
    );
  });

  modelCache.set(type, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Precision Scaling, Ground Anchoring & Orientation
// ---------------------------------------------------------------------------

function positionModelPrecisely(
  model: any,
  asset: UnifiedAsset,
  config: { modelPath: string; targetHeight: number; axis: "Y" | "Z" },
  maplibregl: any,
  THREE: any
) {
  // 1. Ensure all materials are brightly lit, double-sided, and hide extraneous background geometry
  model.traverse((node: any) => {
    // Hide extraneous background ground tiles if present in camera model
    if (node.name && node.name.includes("Plane007")) {
      node.visible = false;
      return;
    }
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat: any) => {
          if (mat) {
            mat.side = THREE.DoubleSide;
            if (mat.roughness !== undefined) mat.roughness = Math.min(mat.roughness, 0.4);
            if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.1);
            mat.needsUpdate = true;
          }
        });
      }
    }
  });

  // 2. Align height axis with MapLibre's Z axis (Altitude = UP in Mercator)
  if (config.axis === "Y") {
    // For Y-up models (like camera_pole.glb): rotate 90 deg around X so Y becomes Z (up)
    model.rotation.set(Math.PI / 2, 0, 0);
  } else {
    // For Z-up models (like stylized_traffic_light.glb): already Z-up, no X rotation
    model.rotation.set(0, 0, 0);
  }
  model.updateMatrixWorld(true);

  // 3. Compute accurate bounding box in oriented space
  const orientedBox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  orientedBox.getSize(size);

  // 4. Calculate exact meter scale in Mercator units
  const mercator = maplibregl.MercatorCoordinate.fromLngLat(
    { lng: asset.longitude, lat: asset.latitude },
    0
  );
  const meterScale = mercator.meterInMercatorCoordinateUnits();

  // Scale model so its height equals config.targetHeight in meters
  const currentHeight = Math.max(size.z, 0.5);
  const finalScale = (config.targetHeight / currentHeight) * meterScale;
  model.scale.set(finalScale, finalScale, finalScale);
  model.updateMatrixWorld(true);

  // 5. Ground alignment: anchor the base of the pole at ground level (Z = 0)
  // and center horizontally over the coordinate
  const scaledBox = new THREE.Box3().setFromObject(model);
  const bottomOffsetZ = -scaledBox.min.z;
  const centerOffsetX = -(scaledBox.min.x + scaledBox.max.x) / 2;
  const centerOffsetY = -(scaledBox.min.y + scaledBox.max.y) / 2;

  model.position.set(
    mercator.x + centerOffsetX,
    mercator.y + centerOffsetY,
    mercator.z + bottomOffsetZ
  );
  model.updateMatrixWorld(true);
}
