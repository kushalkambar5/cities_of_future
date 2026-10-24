"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MANGALORE = {
  lng: 74.856,
  lat: 12.9141,
  zoom: 13.4,
  pitch: 60,
  bearing: -18,
};

const STORAGE_KEY = "mangalore-street-assets";

const ASSET_TYPE_DETAILS = {
  camera: {
    label: "CCTV camera",
    icon: "◉",
    className: "camera",
  },
  "traffic-light": {
    label: "Traffic light",
    icon: "▥",
    className: "traffic-light",
  },
};

const MODEL_DETAILS = {
  camera: {
    modelPath: "/camera_pole.glb",
    targetHeight: 4.5,
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
  },
  "traffic-light": {
    modelPath: "/stylized_traffic_light.glb",
    targetHeight: 5.5,
    rotation: { x: 0, y: 0, z: 0 },
  },
};

export default function StreetAssetsApp() {
  const [assets, setAssets] = useState([]);
  const [formValues, setFormValues] = useState({
    latitude: "",
    longitude: "",
    type: "camera",
    label: "",
  });
  const [formMessage, setFormMessage] = useState("");
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pendingCoordinate, setPendingCoordinate] = useState(null);
  const [pickerPosition, setPickerPosition] = useState(null);
  const [mapError, setMapError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const maplibreRef = useRef(null);
  const modelCacheRef = useRef(new Map());
  const assetModelLayerRef = useRef(null);
  const selectionMarkerRef = useRef(null);
  const assetsRef = useRef([]);
  const pendingCoordinateRef = useRef(null);
  const isPickingRef = useRef(false);

  useEffect(() => {
    assetsRef.current = assets;
    assetModelLayerRef.current?.syncAssets(assets);
  }, [assets]);

  useEffect(() => {
    const storedAssets = loadAssets();
    assetsRef.current = storedAssets;
    setAssets(storedAssets);
  }, []);

  const positionPickerCard = useCallback((lngLat) => {
    const map = mapRef.current;
    if (!map) return;

    const point = map.project(lngLat);
    const mapContainer = map.getContainer();
    const cardWidth = 238;
    const cardHeight = 190;
    const margin = 16;
    const maxLeft = Math.max(margin, mapContainer.clientWidth - cardWidth - margin);
    const maxTop = Math.max(margin, mapContainer.clientHeight - cardHeight - margin);

    setPickerPosition({
      left: Math.min(Math.max(point.x + 18, margin), maxLeft),
      top: Math.min(Math.max(point.y - cardHeight - 18, margin), maxTop),
    });
  }, []);

  const showMapLocationChoice = useCallback(
    (lngLat) => {
      const maplibregl = maplibreRef.current;
      const map = mapRef.current;
      if (!map || !maplibregl) return;

      const nextCoordinate = { lng: lngLat.lng, lat: lngLat.lat };
      pendingCoordinateRef.current = nextCoordinate;
      setPendingCoordinate(nextCoordinate);
      setFormValues((current) => ({
        ...current,
        latitude: lngLat.lat.toFixed(6),
        longitude: lngLat.lng.toFixed(6),
      }));

      selectionMarkerRef.current?.remove();
      const markerElement = document.createElement("div");
      markerElement.className = "coordinate-picker-marker";
      markerElement.setAttribute("aria-label", "Selected asset location");
      selectionMarkerRef.current = new maplibregl.Marker({ element: markerElement })
        .setLngLat(lngLat)
        .addTo(map);

      isPickingRef.current = false;
      setIsPickingLocation(false);
      map.getCanvas().style.cursor = "";
      positionPickerCard(lngLat);
      setFormMessage("Choose CCTV camera or traffic light for the selected point.");
    },
    [positionPickerCard],
  );

  useEffect(() => {
    let cancelled = false;
    let map;

    async function initializeMap() {
      try {
        const [maplibreModule, threeModule, gltfModule, skeletonUtilsModule] =
          await Promise.all([
            import("maplibre-gl"),
            import("three"),
            import("three/addons/loaders/GLTFLoader.js"),
            import("three/addons/utils/SkeletonUtils.js"),
          ]);

        if (cancelled || !mapContainerRef.current) return;

        const maplibregl = maplibreModule.default ?? maplibreModule;
        const THREE = threeModule;
        const GLTFLoader = gltfModule.GLTFLoader;
        const cloneModel = skeletonUtilsModule.clone ?? skeletonUtilsModule.default?.clone;

        if (!GLTFLoader || !cloneModel) {
          throw new Error("Three.js model helpers could not be loaded.");
        }

        maplibreRef.current = maplibregl;
        maplibregl.setWorkerUrl(
          new URL("/maplibre-gl-worker.mjs", window.location.origin).toString(),
        );
        const assetModelLayer = createAssetModelLayer({
          maplibregl,
          THREE,
          GLTFLoader,
          cloneModel,
          modelCache: modelCacheRef.current,
          onModelError: setFormMessage,
        });
        assetModelLayerRef.current = assetModelLayer;

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [MANGALORE.lng, MANGALORE.lat],
          zoom: MANGALORE.zoom,
          pitch: MANGALORE.pitch,
          bearing: MANGALORE.bearing,
          maxPitch: 75,
          attributionControl: false,
        });
        mapRef.current = map;
        let mapLoaded = false;
        map.on("error", (event) => {
          console.error("OpenFreeMap error", event.error);
          if (!mapLoaded) {
            setMapError("The map could not load its tiles. Check your connection and refresh the page.");
          }
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

        map.on("click", (event) => {
          if (isPickingRef.current) showMapLocationChoice(event.lngLat);
        });

        const repositionPicker = () => {
          if (pendingCoordinateRef.current) positionPickerCard(pendingCoordinateRef.current);
        };
        map.on("move", repositionPicker);
        map.on("resize", repositionPicker);

        map.on("load", () => {
          mapLoaded = true;
          if (map.getLayer("building-3d")) {
            map.setLayoutProperty("building-3d", "visibility", "visible");
          }

          try {
            map.addLayer(assetModelLayer);
          } catch (error) {
            console.error("3D asset layer could not be initialized", error);
            setMapError("The map loaded, but its 3D asset layer could not start.");
          }

          assetModelLayer.syncAssets(assetsRef.current);
        });
      } catch (error) {
        console.error("Unable to initialize the OpenFreeMap view", error);
        if (!cancelled) {
          setMapError("The 3D map could not be loaded. Check your connection and refresh the page.");
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
      selectionMarkerRef.current?.remove();
      selectionMarkerRef.current = null;
      assetModelLayerRef.current = null;
      maplibreRef.current = null;
      mapRef.current = null;
      map?.remove();
    };
  }, [positionPickerCard, showMapLocationChoice]);

  const updateFormValue = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const cancelMapPick = () => {
    isPickingRef.current = false;
    pendingCoordinateRef.current = null;
    setIsPickingLocation(false);
    setPendingCoordinate(null);
    setPickerPosition(null);
    selectionMarkerRef.current?.remove();
    selectionMarkerRef.current = null;
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
  };

  const startMapPick = () => {
    if (isPickingRef.current) {
      cancelMapPick();
      return;
    }

    isPickingRef.current = true;
    pendingCoordinateRef.current = null;
    setIsPickingLocation(true);
    setPendingCoordinate(null);
    setPickerPosition(null);
    selectionMarkerRef.current?.remove();
    selectionMarkerRef.current = null;
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "crosshair";
    setFormMessage("Click anywhere on the map to choose the asset location.");
  };

  const placeAsset = (coordinate, type, label) => {
    const error = validateCoordinates(coordinate.lat, coordinate.lng);
    if (error) {
      setFormMessage(error);
      return false;
    }

    const asset = {
      id: createAssetId(),
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      type,
      label: label.trim() || ASSET_TYPE_DETAILS[type].label,
    };
    const nextAssets = [asset, ...assetsRef.current];

    assetsRef.current = nextAssets;
    setAssets(nextAssets);
    saveAssets(nextAssets);
    setFormMessage(
      `${ASSET_TYPE_DETAILS[type].label} placed at ${formatCoordinate(asset.latitude)}, ${formatCoordinate(asset.longitude)}.`,
    );
    setFormValues((current) => ({
      ...current,
      latitude: "",
      longitude: "",
      type,
      label: "",
    }));
    focusAsset(asset);
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const latitude = Number(formValues.latitude);
    const longitude = Number(formValues.longitude);
    placeAsset({ lat: latitude, lng: longitude }, formValues.type, formValues.label);
  };

  const choosePickerType = (type) => {
    const coordinate = pendingCoordinateRef.current;
    if (!coordinate) return;

    const placed = placeAsset(coordinate, type, formValues.label);
    if (!placed) return;

    cancelMapPick();
  };

  const focusAsset = (asset) => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;

    map.flyTo({
      center: [asset.longitude, asset.latitude],
      zoom: Math.max(map.getZoom(), 20.5),
      pitch: 65,
      duration: 1050,
      essential: true,
    });

    window.setTimeout(() => {
      const currentMap = mapRef.current;
      const currentMaplibre = maplibreRef.current;
      if (!currentMap || !currentMaplibre) return;

      createPopup(asset, ASSET_TYPE_DETAILS[asset.type], currentMaplibre)
        .setLngLat([asset.longitude, asset.latitude])
        .addTo(currentMap);
    }, 500);
  };

  const removeAsset = (id) => {
    const nextAssets = assetsRef.current.filter((asset) => asset.id !== id);
    if (nextAssets.length === assetsRef.current.length) return;

    assetsRef.current = nextAssets;
    setAssets(nextAssets);
    saveAssets(nextAssets);
    setFormMessage("Asset removed from the map.");
  };

  const returnToMangalore = () => {
    cancelMapPick();
    mapRef.current?.flyTo({
      center: [MANGALORE.lng, MANGALORE.lat],
      zoom: MANGALORE.zoom,
      pitch: MANGALORE.pitch,
      bearing: MANGALORE.bearing,
      duration: 1200,
      essential: true,
    });
  };

  return (
    <main className="app-shell">
      <aside className="control-panel" aria-label="Map asset placement controls">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            MF
          </div>
          <div>
            <p className="eyebrow">OpenFreeMap workspace</p>
            <h1>Mangalore Street Assets</h1>
          </div>
        </div>

        <p className="intro">
          Drop a CCTV camera or traffic light onto any latitude and longitude in Mangalore&apos;s 3D street view.
        </p>

        <section className="panel-section placement-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Placement</p>
              <h2>Add a street asset</h2>
            </div>
            <span className="count-pill">{assets.length} placed</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="coordinate-heading">
              <div>
                <p className="field-kicker">Coordinates</p>
                <span>Enter them or select a point from the map.</span>
              </div>
              <button
                className="map-pick-button"
                type="button"
                aria-pressed={isPickingLocation}
                onClick={startMapPick}
              >
                <span aria-hidden="true">{isPickingLocation ? "×" : "⌖"}</span>
                {isPickingLocation ? "Cancel map select" : "Select on map"}
              </button>
            </div>

            <div className="coordinate-grid">
              <div>
                <label htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="12.9141"
                  autoComplete="off"
                  required
                  value={formValues.latitude}
                  onChange={(event) => updateFormValue("latitude", event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="74.8560"
                  autoComplete="off"
                  required
                  value={formValues.longitude}
                  onChange={(event) => updateFormValue("longitude", event.target.value)}
                />
              </div>
            </div>

            <label htmlFor="asset-type">Asset type</label>
            <select
              id="asset-type"
              name="assetType"
              value={formValues.type}
              onChange={(event) => updateFormValue("type", event.target.value)}
            >
              <option value="camera">CCTV camera</option>
              <option value="traffic-light">Traffic light</option>
            </select>

            <label htmlFor="asset-label">
              Label <span>(optional)</span>
            </label>
            <input
              id="asset-label"
              name="assetLabel"
              type="text"
              maxLength={40}
              placeholder="e.g. Hampankatta Junction"
              autoComplete="off"
              value={formValues.label}
              onChange={(event) => updateFormValue("label", event.target.value)}
            />

            <button className="primary-button" type="submit">
              <span aria-hidden="true">＋</span>
              Place on map
            </button>
            <p className="form-message" role="status">
              {formMessage}
            </p>
          </form>

          <button className="secondary-button" type="button" onClick={returnToMangalore}>
            <span aria-hidden="true">⌖</span>
            Return to Mangalore view
          </button>
        </section>

        <section className="panel-section asset-list-section">
          <div className="section-heading compact-heading">
            <div>
              <p className="section-kicker">Placed assets</p>
              <h2>Your map items</h2>
            </div>
          </div>
          <div className="asset-list">
            {assets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">
                  ✦
                </div>
                <p>No assets placed yet.</p>
                <span>Enter coordinates above to add the first one.</span>
              </div>
            ) : (
              assets.map((asset) => {
                const details = ASSET_TYPE_DETAILS[asset.type];
                return (
                  <article className="asset-card" key={asset.id}>
                    <div className="asset-card-top">
                      <div className={`asset-icon ${details.className}`} aria-hidden="true">
                        {details.icon}
                      </div>
                      <div className="asset-card-details">
                        <strong>{asset.label}</strong>
                        <span>
                          {formatCoordinate(asset.latitude)}, {formatCoordinate(asset.longitude)}
                        </span>
                      </div>
                    </div>
                    <div className="asset-card-actions">
                      <button type="button" onClick={() => focusAsset(asset)}>
                        Focus
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => removeAsset(asset.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <footer className="panel-footer">
          <span className="legend-dot camera-dot" />
          <span>CCTV</span>
          <span className="legend-dot traffic-dot" />
          <span>Traffic light</span>
        </footer>
      </aside>

      <section className="map-stage" aria-label="Mangalore 3D map">
        <div id="map" ref={mapContainerRef} />
        <div className="map-overlay map-title-card">
          <span className="live-dot" />
          <div>
            <p className="eyebrow">Live planning view</p>
            <strong>Mangalore, Karnataka</strong>
          </div>
        </div>
        <div className="map-overlay map-help-card">
          <span className="help-icon" aria-hidden="true">
            i
          </span>
          <span>Use the panel for coordinates, or select a point directly on the map.</span>
        </div>
        <div className="map-overlay map-status-card">
          <span className="status-swatch" />
          <span>{mapError ? "Map unavailable" : "3D buildings enabled"}</span>
        </div>
        {mapError ? <div className="map-overlay map-error-card">{mapError}</div> : null}
        {pendingCoordinate ? (
          <div
            className="map-overlay map-picker-card"
            style={{ left: pickerPosition?.left ?? 16, top: pickerPosition?.top ?? 16 }}
          >
            <div className="picker-heading">
              <span className="picker-icon" aria-hidden="true">
                ✦
              </span>
              <div>
                <p className="eyebrow">Selected location</p>
                <strong>
                  {formatCoordinate(pendingCoordinate.lat)}, {formatCoordinate(pendingCoordinate.lng)}
                </strong>
              </div>
            </div>
            <p className="picker-copy">Choose what you want to place here.</p>
            <div className="picker-actions">
              <button
                type="button"
                className="picker-type-button camera-choice"
                onClick={() => choosePickerType("camera")}
              >
                <span aria-hidden="true">◉</span>
                CCTV camera
              </button>
              <button
                type="button"
                className="picker-type-button traffic-choice"
                onClick={() => choosePickerType("traffic-light")}
              >
                <span aria-hidden="true">▥</span>
                Traffic light
              </button>
            </div>
            <button type="button" className="picker-cancel-button" onClick={cancelMapPick}>
              Cancel
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function createAssetModelLayer({
  maplibregl,
  THREE,
  GLTFLoader,
  cloneModel,
  modelCache,
  onModelError,
}) {
  return {
    id: "asset-models-3d",
    type: "custom",
    renderingMode: "3d",
    scene: null,
    camera: null,
    renderer: null,
    map: null,
    objects: new Map(),

    onAdd(mapInstance, gl) {
      this.map = mapInstance;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      const ambientLight = new THREE.HemisphereLight(0xdbeeff, 0x203044, 2.4);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 3.2);
      directionalLight.position.set(0, -70, 120);
      this.scene.add(ambientLight, directionalLight);

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
      });
      this.renderer.autoClear = false;
      if (THREE.SRGBColorSpace) this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x000000, 0);

      for (const entry of this.objects.values()) {
        this.loadAsset(entry.asset);
      }
    },

    render(_gl, renderArgs) {
      if (!this.renderer || !this.scene || !this.camera) return;

      try {
        const matrix = renderArgs?.defaultProjectionData?.mainMatrix ?? renderArgs;
        this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
        this.camera.projectionMatrixInverse
          .copy(this.camera.projectionMatrix)
          .invert();
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      } catch (error) {
        console.error("3D asset rendering stopped", error);
        this.renderer = null;
      }
    },

    onRemove() {
      this.objects.clear();
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.map = null;
    },

    syncAssets(nextAssets) {
      const incomingIds = new Set(nextAssets.map((asset) => asset.id));

      for (const id of this.objects.keys()) {
        if (!incomingIds.has(id)) this.removeAsset(id);
      }

      for (const asset of nextAssets) {
        this.addAsset(asset);
      }
    },

    removeAsset(id) {
      const entry = this.objects.get(id);
      if (entry?.object) this.scene?.remove(entry.object);
      this.objects.delete(id);
      this.map?.triggerRepaint();
    },

    addAsset(asset) {
      const config = MODEL_DETAILS[asset.type];
      if (!config || this.objects.has(asset.id)) return;

      this.objects.set(asset.id, { asset, object: null });
      if (!this.scene || !this.map) return;
      this.loadAsset(asset);
    },

    loadAsset(asset) {
      const config = MODEL_DETAILS[asset.type];
      if (!config || !this.scene || !this.map) return;

      loadModelOnce(asset.type, config.modelPath, GLTFLoader, modelCache)
        .then((sourceModel) => {
          const current = this.objects.get(asset.id);
          if (!current || !this.scene) return;

          const model = cloneModel(sourceModel);
          prepareModel(model, asset, config, maplibregl, THREE);
          current.object = model;
          this.scene.add(model);
          this.map?.triggerRepaint();
        })
        .catch((error) => {
          console.error(`Unable to load ${asset.type} model`, error);
          this.objects.delete(asset.id);
          onModelError(
            `${ASSET_TYPE_DETAILS[asset.type].label} model could not be loaded. Check ${config.modelPath}.`,
          );
        });
    },
  };
}

function loadModelOnce(type, modelPath, GLTFLoader, modelCache) {
  if (modelCache.has(type)) return modelCache.get(type);

  const promise = new Promise((resolve, reject) => {
    new GLTFLoader().load(
      modelPath,
      (gltf) => resolve(gltf.scene),
      undefined,
      reject,
    );
  });

  modelCache.set(type, promise);
  return promise;
}

function prepareModel(model, asset, config, maplibregl, THREE) {
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (material) material.side = THREE.DoubleSide;
    });
  });

  const mercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    { lng: asset.longitude, lat: asset.latitude },
    0,
  );
  const meterScale = mercatorCoordinate.meterInMercatorCoordinateUnits();
  model.scale.setScalar(meterScale * config.targetHeight);
  model.position.set(mercatorCoordinate.x, mercatorCoordinate.y, mercatorCoordinate.z);
  model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
}

function createPopup(asset, details, maplibregl) {
  const popup = document.createElement("div");
  popup.innerHTML = `
    <p class="popup-kicker">${escapeHtml(details.label)}</p>
    <p class="popup-title">${escapeHtml(asset.label)}</p>
    <p class="popup-coordinates">${formatCoordinate(asset.latitude)} N<br />${formatCoordinate(asset.longitude)} E</p>
  `;
  return new maplibregl.Popup({ offset: 22, closeButton: true }).setDOMContent(popup);
}

function validateCoordinates(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "Enter both a latitude and a longitude.";
  }

  if (latitude < -90 || latitude > 90) {
    return "Latitude must be between -90 and 90.";
  }

  if (longitude < -180 || longitude > 180) {
    return "Longitude must be between -180 and 180.";
  }

  return "";
}

function loadAssets() {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored
      .filter(
        (asset) =>
          asset &&
          typeof asset.id === "string" &&
          typeof asset.latitude === "number" &&
          typeof asset.longitude === "number" &&
          ASSET_TYPE_DETAILS[asset.type],
      )
      .map((asset) => ({
        ...asset,
        label:
          typeof asset.label === "string" && asset.label.trim()
            ? asset.label
            : ASSET_TYPE_DETAILS[asset.type].label,
      }));
  } catch {
    return [];
  }
}

function saveAssets(assets) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

function createAssetId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}
