"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  useEffect(() => {
    if (!containerRef.current) return;

    // Fix leaflet default icon assets path
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView(origin, 6);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = layerGroup;
    }

    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const points: [number, number][] = [];

    // 1. Origin Marker
    if (origin && !isNaN(origin[0]) && !isNaN(origin[1])) {
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
        html: `<div style="background:#2563eb;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;border:2px solid #60a5fa;white-space:nowrap;box-shadow:0 0 12px rgba(37,99,235,0.7);animation:pulse 2s infinite;">🚚 En Route</div>`,
        iconSize: [95, 26],
        iconAnchor: [47, 13],
      });
      L.marker(currentPos, { icon: courierIcon }).addTo(layerGroup);
    }

    // 3. Destination Marker
    if (destination && !isNaN(destination[0]) && !isNaN(destination[1])) {
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
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.8,
      }).addTo(layerGroup);

      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        // Fallback if bounds invalid
      }
    }

    // Invalidate size to ensure proper rendering inside container
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      // Keep map instance alive across rerenders, or remove on true unmount
    };
  }, [origin, destination, currentPos]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl relative z-0"
    />
  );
}
