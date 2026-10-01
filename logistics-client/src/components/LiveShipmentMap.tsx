"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveShipmentMapProps {
  origin: [number, number];
  destination: [number, number];
  currentPos?: [number, number] | null;
}

function AutoFitBounds({ points }: { points: ([number, number] | null)[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter(
      (p): p is [number, number] => p !== null && !isNaN(p[0]) && !isNaN(p[1])
    );
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

export default function LiveShipmentMap({
  origin,
  destination,
  currentPos,
}: LiveShipmentMapProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  const originIcon = new L.DivIcon({
    html: `<div style="background-color:#0f172a;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid #fff;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);">ORIGIN</div>`,
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });

  const destIcon = new L.DivIcon({
    html: `<div style="background-color:#16a34a;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid #fff;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);">DEST</div>`,
    iconSize: [50, 20],
    iconAnchor: [25, 10],
  });

  const currentIcon = new L.DivIcon({
    html: `<div style="background-color:#dc2626;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid #fff;box-shadow:0 0 10px rgba(220,38,38,0.6);white-space:nowrap;">📍 LOCATION</div>`,
    iconSize: [80, 20],
    iconAnchor: [40, 10],
  });

  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        const start = currentPos || origin;
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (active && data.code === "Ok" && data.routes?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          setRouteCoords(coords);
        }
      } catch (err) {
        console.warn("OSRM Route fallback to direct line", err);
      }
    };

    fetchRoute();
    return () => {
      active = false;
    };
  }, [origin, destination, currentPos]);

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg relative z-0">
      <MapContainer
        center={origin}
        zoom={7}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[380px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <AutoFitBounds points={[origin, destination, currentPos ?? null]} />
        <Marker position={origin} icon={originIcon} />
        <Marker position={destination} icon={destIcon} />
        {currentPos && <Marker position={currentPos} icon={currentIcon} />}
        {routeCoords.length > 0 ? (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.85 }}
          />
        ) : (
          <Polyline
            positions={[origin, destination]}
            pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.5, dashArray: "6, 8" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
