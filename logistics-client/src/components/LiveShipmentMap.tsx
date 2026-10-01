"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  fixLeafletDefaultIcons,
  createBaseTileLayer,
  MAP_LAYERS,
} from "@/lib/mapConfig";
import { ShieldCheck, Truck } from "lucide-react";

interface LiveShipmentMapProps {
  origin: [number, number];
  destination: [number, number];
  currentPos?: [number, number] | null;
}

export default function LiveShipmentMap({
  origin,
  destination,
  currentPos,
}: LiveShipmentMapProps) {
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
      if ((containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }

      const validCenter: [number, number] =
        origin && !isNaN(origin[0]) && !isNaN(origin[1]) && (origin[0] !== 0 || origin[1] !== 0)
          ? origin
          : [28.6139, 77.209]; // Default center

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView(validCenter, 6);

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

  // Handle Markers & Polyline
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const points: [number, number][] = [];

    // 1. Origin Marker
    if (origin && !isNaN(origin[0]) && !isNaN(origin[1]) && (origin[0] !== 0 || origin[1] !== 0)) {
      points.push(origin);
      const originIcon = L.divIcon({
        html: `<div style="background:#0f172a;color:#94a3b8;font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;border:1.5px solid #334155;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.5);">📍 Origin Hub</div>`,
        iconSize: [90, 24],
        iconAnchor: [45, 12],
      });
      L.marker(origin, { icon: originIcon }).addTo(layerGroup);
    }

    // 2. Current Courier Position Marker
    if (currentPos && !isNaN(currentPos[0]) && !isNaN(currentPos[1])) {
      points.push(currentPos);
      const courierIcon = L.divIcon({
        html: `<div style="background:#2563eb;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;border:2px solid #60a5fa;white-space:nowrap;box-shadow:0 0 14px rgba(37,99,235,0.8);animation:pulse 2s infinite;">🚚 En Route</div>`,
        iconSize: [95, 26],
        iconAnchor: [47, 13],
      });
      L.marker(currentPos, { icon: courierIcon }).addTo(layerGroup);
    }

    // 3. Destination Marker
    if (destination && !isNaN(destination[0]) && !isNaN(destination[1]) && (destination[0] !== 0 || destination[1] !== 0)) {
      points.push(destination);
      const destIcon = L.divIcon({
        html: `<div style="background:#16a34a;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;border:1.5px solid #4ade80;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.5);">🎯 Destination</div>`,
        iconSize: [95, 24],
        iconAnchor: [47, 12],
      });
      L.marker(destination, { icon: destIcon }).addTo(layerGroup);
    }

    // 4. Polyline Path
    if (points.length >= 2) {
      L.polyline(points, {
        color: "#3b82f6",
        weight: 4.5,
        dashArray: "6, 8",
        opacity: 0.85,
      }).addTo(layerGroup);

      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        // Fallback
      }
    }

    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [origin, destination, currentPos]);

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
    <div className="w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative z-0">
      {/* Map Container */}
      <div ref={containerRef} className="w-full h-full min-h-[460px] bg-slate-900" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
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
          <span className="font-semibold">Leaflet + ArcGIS Live Telemetry</span>
        </div>
      </div>
    </div>
  );
}
