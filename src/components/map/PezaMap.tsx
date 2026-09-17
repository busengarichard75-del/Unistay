"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Home, Wrench, ShoppingBag, Navigation, LocateFixed } from "lucide-react";
import Link from "next/link";
import type { Property } from "@/types/property";
import type { Service } from "@/types/service";
import type { Product } from "@/types/product";
import { isServiceBoosted } from "@/types/service";
import { isProductBoosted } from "@/types/product";
import { isBoosted as isPropertyBoosted } from "@/lib/boostService";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Custom colored pin icons per type ───
function makePin(color: string, iconHtml: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:32px;height:42px;">
        <div style="
          position:absolute;left:0;top:0;width:32px;height:32px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
          border:2px solid white;
        "></div>
        <div style="
          position:absolute;left:0;top:0;width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:15px;line-height:1;
        ">${iconHtml}</div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
  });
}

const propertyIcon = makePin("#4A90D9", "🏠");
const serviceIcon = makePin("#0EA5E9", "🛠️");
const productIcon = makePin("#F97316", "🛒");

// ─── User location marker (blue dot) ───
const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:32px;height:32px;background:rgba(59,130,246,0.3);border-radius:50%;animation:peza-ping 1.5s ease-out infinite;"></div>
      <div style="width:16px;height:16px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>
    <style>
      @keyframes peza-ping {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export type MapMarker =
  | { kind: "property"; data: Property }
  | { kind: "service"; data: Service }
  | { kind: "product"; data: Product };

export type MapFilter = "all" | "properties" | "services" | "products";

interface PezaMapProps {
  markers: MapMarker[];
  filter?: MapFilter;
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  showUserLocation?: boolean;
}

// Fit map to bounds when markers change
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, points]);
  return null;
}

// Auto-locate button sub-component
function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate(pos.coords.latitude, pos.coords.longitude);
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      title="Find my location"
    >
      <LocateFixed size={18} className={`text-[var(--nexora-primary)] ${busy ? "animate-pulse" : ""}`} />
    </button>
  );
}

export function PezaMap({
  markers,
  filter = "all",
  height = "500px",
  defaultCenter = [-15.3875, 28.3228],
  defaultZoom = 12,
  showUserLocation = true,
}: PezaMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Ask for location on mount (optional)
  useEffect(() => {
    if (!showUserLocation) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [showUserLocation]);

  // Filter markers by type and availability + coords
  const visible = useMemo(() => {
    return markers.filter((m) => {
      if (filter === "properties" && m.kind !== "property") return false;
      if (filter === "services" && m.kind !== "service") return false;
      if (filter === "products" && m.kind !== "product") return false;

      const d: any = m.data;
      if (d.adminHidden) return false;

      // Skip online services (no physical pin)
      if (m.kind === "service" && (d as Service).isOnline) return false;

      // Require coordinates
      if (typeof d.latitude !== "number" || typeof d.longitude !== "number") return false;

      return true;
    });
  }, [markers, filter]);

  const points: [number, number][] = useMemo(() => {
    const pts: [number, number][] = visible.map((m) => [
      (m.data as any).latitude,
      (m.data as any).longitude,
    ]);
    if (userLocation) pts.push([userLocation.lat, userLocation.lng]);
    return pts;
  }, [visible, userLocation]);

  const center: [number, number] = useMemo(() => {
    if (visible.length > 0) {
      const first: any = visible[0].data;
      return [first.latitude, first.longitude];
    }
    return defaultCenter;
  }, [visible, defaultCenter]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>📍 You are here</Popup>
          </Marker>
        )}

        {/* Content markers */}
        {visible.map((m) => {
          const d: any = m.data;
          const boosted =
            m.kind === "property"
              ? isPropertyBoosted(d as Property)
              : m.kind === "service"
              ? isServiceBoosted(d as Service)
              : isProductBoosted(d as Product);

          const icon =
            m.kind === "property" ? propertyIcon : m.kind === "service" ? serviceIcon : productIcon;

          const title =
            m.kind === "property"
              ? (d as Property).title
              : m.kind === "service"
              ? (d as Service).title
              : (d as Product).name;

          const href =
            m.kind === "property"
              ? `/property/${d.id}`
              : m.kind === "service"
              ? `/services/${d.id}`
              : `/marketplace/${d.id}`;

          const priceLabel =
            m.kind === "property"
              ? `K${d.price.toLocaleString()}/${
                  d.paymentPeriod === "termly" ? "term" : "mo"
                }`
              : m.kind === "service"
              ? d.priceType === "from" && d.priceFrom
                ? `From K${d.priceFrom.toLocaleString()}`
                : "Contact for price"
              : `K${d.price.toLocaleString()}`;

          return (
            <Marker
              key={`${m.kind}-${d.id}`}
              position={[d.latitude, d.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {m.kind === "property" ? "Room" : m.kind === "service" ? "Service" : "Product"}
                    </span>
                    {boosted && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        ⚡
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {title}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--nexora-primary)]">
                    {priceLabel}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 truncate">
                    📍 {d.location}
                  </p>
                  <Link
                    href={href}
                    className="mt-2 inline-block w-full rounded-full bg-[var(--nexora-primary)] px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
                  >
                    View listing →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Auto-fit when markers exist */}
        {points.length > 0 && <FitBounds points={points} />}

        {/* Locate me button */}
        {showUserLocation && (
          <LocateButton
            onLocate={(lat, lng) => {
              setUserLocation({ lat, lng });
              if (mapRef.current) mapRef.current.flyTo([lat, lng], 15);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}