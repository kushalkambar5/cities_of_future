# Mangalore Street Assets

This directory is a self-contained Next.js application for placing CCTV cameras
and traffic lights on an OpenFreeMap 3D view of Mangalore.

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

For a production check:

```bash
npm run build
npm run start
```

## User flow

1. Enter a latitude and longitude, or select **Select on map** and click a point
   in the 3D map.
2. When selecting from the map, choose **CCTV camera** or **Traffic light**
   in the location card to place it immediately.
3. When entering coordinates manually, choose the asset type, optionally add a
   label, and select **Place on map**.

Placed assets are shown in the map and sidebar. The list supports focusing the
map on an asset and removing it. The current list is persisted in browser local
storage.

## Project structure

- `app/page.js` renders the route.
- `app/street-assets-app.js` owns the client-side MapLibre, Three.js, and asset
  placement behavior.
- `app/globals.css` contains the UI and MapLibre styling.
- `public/*.glb` contains the local 3D models.
- `public/maplibre-gl-worker.mjs` is the MapLibre worker served from the same
  origin so the map works with Next.js bundling.
