"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X, MapPin, CheckCircle, AlertCircle, Loader2, Navigation, Crosshair } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom location marker (blue dot)
const locationIcon = L.divIcon({
  className: "",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
      <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectable?: boolean;
  height?: string;
  defaultCenter?: [number, number];
  zoom?: number;
  showSearch?: boolean;
  showFallback?: boolean;
  showMyLocation?: boolean;
}

export function PropertyMap({
  latitude,
  longitude,
  onLocationSelect,
  selectable = false,
  height = "300px",
  defaultCenter = [-15.3875, 28.3228],
  zoom = 13,
  showSearch = true,
  showFallback = true,
  showMyLocation = true,
}: PropertyMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [fallbackLat, setFallbackLat] = useState(latitude?.toString() || "");
  const [fallbackLng, setFallbackLng] = useState(longitude?.toString() || "");
  const mapRef = useRef<L.Map | null>(null);

  // ─── My Location state ──────────────────────────────────────
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const center: [number, number] =
    latitude !== undefined && longitude !== undefined
      ? [latitude, longitude]
      : defaultCenter;

  // ─── Get My Location ────────────────────────────────────────
  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCurrentLocation({ lat, lng });
        setIsLocating(false);

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16);
        }

        if (selectable && onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location in your browser.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("Unable to get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── Geocode search ──────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (onLocationSelect) {
          onLocationSelect(latNum, lonNum);
        }
        if (mapRef.current) {
          mapRef.current.flyTo([latNum, lonNum], 15);
        }
        setSearchQuery("");
      } else {
        setSearchError("Location not found. Try a different search.");
      }
    } catch (error) {
      setSearchError("Search failed. Please try again.");
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // ─── Clear location ─────────────────────────────────────────
  const handleClearLocation = () => {
    if (onLocationSelect) {
      onLocationSelect(0, 0);
    }
  };

  // ─── Fallback: update from inputs ────────────────────────────
  const handleFallbackApply = () => {
    const lat = parseFloat(fallbackLat);
    const lng = parseFloat(fallbackLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15);
      }
    }
  };

  // ─── Map ready handler ──────────────────────────────────────
  const handleMapReady = () => {
    // Map loaded successfully – clear any error state
    setMapError(false);
  };

  return (
    <div className="space-y-3">
      {/* ─── Search & Controls ─── */}
      {showSearch && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[140px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search for a location..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pl-9 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            />
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="rounded-lg bg-[var(--nexora-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>

          {showMyLocation && (
            <button
              type="button"
              onClick={getMyLocation}
              disabled={isLocating}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Use my current location"
            >
              {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
              <span className="hidden sm:inline">My Location</span>
            </button>
          )}

          {latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0 && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      )}

      {/* ─── Location Error ─── */}
      {locationError && (
        <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={16} />
          <span>{locationError}</span>
        </div>
      )}

      {/* ─── Search Error ─── */}
      {searchError && (
        <div className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle size={16} />
          <span>{searchError}</span>
        </div>
      )}

      {/* ─── Location Confirmation Badge ─── */}
      {latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
          <CheckCircle size={16} className="text-green-600" />
          <span>Location set: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        </div>
      )}

      {/* ─── Current Location Badge ─── */}
      {currentLocation && !locationError && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 border border-blue-200">
          <Crosshair size={16} className="text-blue-600" />
          <span>📍 Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
        </div>
      )}

      {/* ─── Map or Fallback ─── */}
      {mapError && showFallback ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
            <AlertCircle size={18} />
            <span>Map failed to load. Enter coordinates manually:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500">Latitude</label>
              <input
                type="number"
                step="any"
                value={fallbackLat}
                onChange={(e) => setFallbackLat(e.target.value)}
                className="mt-1 w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--nexora-primary)]"
                placeholder="-15.3875"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Longitude</label>
              <input
                type="number"
                step="any"
                value={fallbackLng}
                onChange={(e) => setFallbackLng(e.target.value)}
                className="mt-1 w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--nexora-primary)]"
                placeholder="28.3228"
              />
            </div>
            <button
              type="button"
              onClick={handleFallbackApply}
              className="mt-4 rounded-lg bg-[var(--nexora-primary)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--nexora-primary-hover)]"
            >
              Apply
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{ height, width: "100%", borderRadius: "0.75rem", overflow: "hidden" }}
          className="shadow-sm border border-gray-200"
        >
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            attributionControl={false}
            ref={(map) => {
              if (map) {
                mapRef.current = map;
              }
            }}
            whenReady={handleMapReady}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Property marker */}
            {latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0 && (
              <Marker position={[latitude, longitude]}>
                <Popup>
                  {selectable ? "Selected location" : "Property location"}
                </Popup>
              </Marker>
            )}

            {/* Current location marker (blue dot) */}
            {currentLocation && (
              <Marker position={[currentLocation.lat, currentLocation.lng]} icon={locationIcon}>
                <Popup>📍 Your current location</Popup>
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
      )}

      {/* ─── Help text ─── */}
      {selectable && !mapError && (
        <p className="text-xs text-gray-400">
          {latitude && longitude && latitude !== 0 && longitude !== 0
            ? "Click on the map to adjust the location, or use 'My Location' to find yourself."
            : "Click on the map to set the property location, or use 'My Location' to find yourself."}
        </p>
      )}
    </div>
  );
}

// ─── LocationMarker Component ──────────────────────────────────
function LocationMarker({
  selectable,
  onLocationSelect,
  latitude,
  longitude,
}: {
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

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, map]);

  return null;
}