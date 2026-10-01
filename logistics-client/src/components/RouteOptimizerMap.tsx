"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Waypoint } from "@/lib/services/routeOptimizer";
import {
  fixLeafletDefaultIcons,
  createBaseTileLayer,
  MAP_LAYERS,
} from "@/lib/mapConfig";
import { Layers, ShieldCheck, Zap } from "lucide-react";

interface RouteOptimizerMapProps {
  waypoints: Waypoint[];
  routeGeometry: [number, number][];
}

export default function RouteOptimizerMap({
  waypoints,
  routeGeometry,
}: RouteOptimizerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeLayer, setActiveLayer] = useState<keyof typeof MAP_LAYERS>("arcgisStreets");

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      // Clear any leftover Leaflet instance ID on the container
      if ((containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }

      const initialCenter: [number, number] =
        waypoints.length > 0 && waypoints[0]?.lat && waypoints[0]?.lng
          ? [waypoints[0].lat, waypoints[0].lng]
          : [30.7333, 76.7794]; // Northern Logistics Cluster (Chandigarh/Delhi)

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView(initialCenter, 6);

      const tileLayer = createBaseTileLayer(activeLayer).addTo(map);
      currentTileLayerRef.current = tileLayer;

      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = layerGroup;
    }

    const map = mapRef.current;
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 600);
    }
  }, []);

  // Handle Tile Layer Switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newTileLayer = createBaseTileLayer(activeLayer).addTo(map);
    currentTileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [activeLayer]);

  // Handle Waypoints & Route Polylines
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const validWaypoints = waypoints.filter(
      (w) => w && typeof w.lat === "number" && typeof w.lng === "number" && !isNaN(w.lat) && !isNaN(w.lng)
    );

    const allPoints: [number, number][] =
      routeGeometry.length > 0
        ? routeGeometry
        : validWaypoints.map((w) => [w.lat, w.lng]);

    // Add Waypoint Numbered Markers
    validWaypoints.forEach((wp, index) => {
      const isOrigin = index === 0;
      const isDest = index === validWaypoints.length - 1;
      const badgeBg = isOrigin
        ? "#0f172a"
        : isDest
        ? "#16a34a"
        : "#2563eb";
      const label = isOrigin
        ? "1. ORIGIN"
        : isDest
        ? `${index + 1}. DEST`
        : `${index + 1}. STOP`;

      const icon = L.divIcon({
        html: `<div style="background-color:${badgeBg};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;border:1.5px solid #fff;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${label}: ${wp.city || wp.name}</div>`,
        iconSize: [110, 22],
        iconAnchor: [55, 11],
      });

      L.marker([wp.lat, wp.lng], { icon }).addTo(layerGroup);
    });

    // Add Road Polyline
    if (routeGeometry.length > 0) {
      L.polyline(routeGeometry, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);
    } else if (validWaypoints.length > 1) {
      const direct = validWaypoints.map((w) => [w.lat, w.lng] as [number, number]);
      L.polyline(direct, {
        color: "#3b82f6",
        weight: 3.5,
        dashArray: "6, 8",
        opacity: 0.75,
      }).addTo(layerGroup);
    }

    // Auto-fit bounds
    const valid = allPoints.filter(
      (p) => p && typeof p[0] === "number" && typeof p[1] === "number" && !isNaN(p[0]) && !isNaN(p[1])
    );

    if (valid.length > 0) {
      try {
        const bounds = L.latLngBounds(valid);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        // bounds error safeguard
      }
    }

    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [waypoints, routeGeometry]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
        currentTileLayerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative z-0">
      {/* Map DOM Element */}
      <div ref={containerRef} className="w-full h-full min-h-[440px] bg-slate-900" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        {/* Layer Selector */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-1 shadow-lg text-[11px]">
          <button
            type="button"
            onClick={() => setActiveLayer("arcgisStreets")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeLayer === "arcgisStreets"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ArcGIS Streets
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer("arcgisSatellite")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeLayer === "arcgisSatellite"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer("osm")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeLayer === "osm"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Bottom Floating Info Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-emerald-500/30 text-[10px] text-emerald-400 shadow-md">
          <ShieldCheck className="h-3 w-3" />
          <span className="font-semibold">Leaflet + ArcGIS Vector Tiles Active</span>
        </div>
        {waypoints.length === 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-amber-500/30 text-[10px] text-amber-400 shadow-md">
            <Zap className="h-3 w-3" />
            <span>Select hubs to preview route</span>
          </div>
        )}
      </div>
    </div>
  );
}
