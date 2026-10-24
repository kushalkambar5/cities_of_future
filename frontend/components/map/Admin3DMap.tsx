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
    targetHeight: 6.0, // 6 meters tall
    axis: "Y" as const, // Native vertical axis in file is Y
  },
  "traffic-light": {
    modelPath: "/stylized_traffic_light.glb",
    targetHeight: 5.5, // 5.5 meters tall
    axis: "Z" as const, // Native vertical axis in file is Z
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
      popupDiv.className = "text-xs space-y-1.5 select-none";

      const isCamera = asset.type === "camera";
      const cam = isCamera ? (asset.raw as Camera) : null;
      const typeBadgeColor = isCamera 
        ? "bg-purple-500/20 text-purple-300 border-purple-500/40" 
        : "bg-amber-500/20 text-amber-300 border-amber-500/40";
      const typeLabel = isCamera ? "CCTV CAMERA" : "TRAFFIC LIGHT";

      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${typeBadgeColor}">
            ${typeLabel}
          </span>
          <span class="font-mono text-[11px] font-semibold text-slate-400">
            ${asset.id}
          </span>
        </div>
        <div class="pt-1">
          <h4 class="font-bold text-sm text-white">${asset.name}</h4>
          ${isCamera && cam?.trafficLightId ? `
            <p class="text-[11px] text-slate-300 mt-1">
              🚦 Linked TL: <span class="font-semibold text-amber-300">${cam.trafficLightName || cam.trafficLightId}</span>
            </p>
          ` : ''}
          ${isCamera && cam ? `
            <p class="text-[11px] text-slate-300">
              ⚡ Speed Limit: <span class="font-semibold text-emerald-300">${cam.speedLimit} km/h</span>
            </p>
            <p class="text-[11px] text-slate-300">
              ● Status: <span class="font-semibold text-emerald-400">${cam.status}</span>
            </p>
          ` : ''}
          <div class="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
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
      className="relative w-full h-full min-h-[550px] flex-1 rounded-3xl overflow-hidden border border-[#E5E5E5] bg-[#07101d] shadow-soft"
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
        <button
          onClick={toggleBuildings}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-lg ${
            show3dBuildings
              ? "bg-[#0f172a]/90 text-sky-300 border-sky-400/40"
              : "bg-[#0f172a]/60 text-slate-400 border-white/10"
          }`}
          title="Toggle 3D Buildings"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D Buildings</span>
        </button>

        <button
          onClick={resetView}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0f172a]/90 text-slate-200 hover:text-white border border-white/10 backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5 hover:bg-[#1e293b]"
          title="Reset Camera Angle"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Camera</span>
        </button>
      </div>

      {/* Floating HUD: Bottom Left 3D Asset Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#0f172a]/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-white shadow-xl flex items-center gap-4 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
          <span className="font-medium text-slate-300">
            🚦 Traffic Light ({trafficLights.length})
          </span>
        </div>
        <div className="h-3 w-[1px] bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
          <span className="font-medium text-slate-300">
            📷 CCTV Camera ({cameras.length})
          </span>
        </div>
      </div>

      {/* Error Overlay if map fails */}
      {mapError && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6 text-center text-white">
          <div className="max-w-md bg-[#0f172a] p-6 rounded-2xl border border-rose-500/40 shadow-2xl">
            <p className="text-rose-400 font-bold mb-2">Map Layer Error</p>
            <p className="text-xs text-slate-300 mb-4">{mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
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
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x000000, 0);

      // Load queued objects
      for (const entry of this.objects.values()) {
        this.loadAsset(entry.asset);
      }
    },

    render(_gl: any, renderArgs: any) {
      if (!this.renderer || !this.scene || !this.camera) return;

      try {
        // Critical: in MapLibre GL v5/v6, modelViewProjectionMatrix maps world Mercator (0..1) directly to clip space (-1..1).
        // DO NOT use defaultProjectionData.mainMatrix which is multiplied by EXTENT (8192).
        const matrix = 
          renderArgs?.modelViewProjectionMatrix || 
          (Array.isArray(renderArgs) || renderArgs instanceof Float64Array ? renderArgs : null) || 
          renderArgs?.defaultProjectionData?.fallbackMatrix;

        if (matrix) {
          this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
          this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        }

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
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
  // 1. Ensure all materials are brightly lit, double-sided, and not dark silhouettes
  model.traverse((node: any) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat: any) => {
          if (mat) {
            mat.side = THREE.DoubleSide;
            if (mat.roughness !== undefined) mat.roughness = Math.min(mat.roughness, 0.45);
            if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.15);
            mat.needsUpdate = true;
          }
        });
      }
    }
  });

  // 2. Align height axis with MapLibre's Z axis (Altitude = UP in Mercator)
  // For camera pole: native height is Y, so rotate 90 deg on X
  // For stylized traffic light: native height is Z, so no X-rotation is needed
  if (config.axis === "Y") {
    model.rotation.set(Math.PI / 2, 0, 0);
  } else {
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
}
