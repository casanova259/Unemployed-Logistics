"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Waypoint } from "@/lib/services/routeOptimizer";

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

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const initialCenter: [number, number] =
        waypoints.length > 0
          ? [waypoints[0].lat, waypoints[0].lng]
          : [20.5937, 78.9629]; // Default India center

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView(initialCenter, 5);

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

    const allPoints: [number, number][] =
      routeGeometry.length > 0
        ? routeGeometry
        : waypoints.map((w) => [w.lat, w.lng]);

    // Add Waypoint Numbered Markers
    waypoints.forEach((wp, index) => {
      const isOrigin = index === 0;
      const isDest = index === waypoints.length - 1;
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
        weight: 4.5,
        opacity: 0.85,
      }).addTo(layerGroup);
    } else if (waypoints.length > 1) {
      const direct = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
      L.polyline(direct, {
        color: "#3b82f6",
        weight: 3,
        dashArray: "4, 6",
        opacity: 0.7,
      }).addTo(layerGroup);
    }

    // Auto-fit bounds
    const valid = allPoints.filter(
      (p) => p && !isNaN(p[0]) && !isNaN(p[1])
    );
    if (valid.length > 0) {
      try {
        const bounds = L.latLngBounds(valid);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        // bounds error safeguard
      }
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [waypoints, routeGeometry]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (waypoints.length === 0) {
    return (
      <div className="w-full h-full min-h-[440px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
        Select waypoints and click Optimize Route to view network mapping.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl relative z-0"
    />
  );
}
