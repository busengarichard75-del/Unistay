"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet's default icons break in some bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PropertyMapProps {
  // Current coordinates (if any)
  latitude?: number;
  longitude?: number;
  // Callback when coordinates change (for selection mode)
  onLocationSelect?: (lat: number, lng: number) => void;
  // If true, map is clickable to select location
  selectable?: boolean;
  // Height of the map (e.g., "300px")
  height?: string;
  // Center position if no coordinates provided (default: Lusaka, Zambia)
  defaultCenter?: [number, number];
  // Zoom level
  zoom?: number;
}

function LocationMarker({ selectable, onLocationSelect, latitude, longitude }: {
  selectable: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  latitude?: number;
  longitude?: number;
}) {
  const map = useMapEvents({
    click(e) {
      if (!selectable) return;
      const { lat, lng } = e.latlng;
      onLocationSelect?.(lat, lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // If coordinates are provided, center the map on them
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, map]);

  return null;
}

export function PropertyMap({
  latitude,
  longitude,
  onLocationSelect,
  selectable = false,
  height = "300px",
  defaultCenter = [-15.3875, 28.3228], // Lusaka, Zambia
  zoom = 13,
}: PropertyMapProps) {
  const center: [number, number] =
    latitude !== undefined && longitude !== undefined
      ? [latitude, longitude]
      : defaultCenter;

  return (
    <div style={{ height, width: "100%", borderRadius: "0.75rem", overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {latitude !== undefined && longitude !== undefined && (
          <Marker position={[latitude, longitude]}>
            <Popup>
              {selectable ? "Selected location" : "Property location"}
            </Popup>
          </Marker>
        )}

        <LocationMarker
          selectable={selectable}
          onLocationSelect={onLocationSelect}
          latitude={latitude}
          longitude={longitude}
        />
      </MapContainer>
    </div>
  );
}