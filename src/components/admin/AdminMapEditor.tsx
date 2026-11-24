// src/components/admin/AdminMapEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "sonner";
import { MapPoint, MapPointCategory } from "@/types/mapPoint";
import { addMapPoint, getMapPoints, deleteMapPoint } from "@/services/mapPointService";
import { useAuth } from "@/lib/AuthContext";
import { X, MapPin, Trash2, Loader2 } from "lucide-react";

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icon for Admin Pins
const adminPin = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function AdminMapEditor() {
  const { user } = useAuth();
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for the "Add Point" Modal
  const [draftPin, setDraftPin] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MapPointCategory>("landmark");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadPoints();
  }, []);

  async function loadPoints() {
    try {
      const data = await getMapPoints();
      setPoints(data);
    } catch (error) {
      toast.error("Failed to load map points.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSavePoint() {
    if (!draftPin || !name.trim() || !user) return;
    setIsSaving(true);
    try {
      await addMapPoint({
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        latitude: draftPin.lat,
        longitude: draftPin.lng,
        addedBy: user.uid,
        createdAt: Date.now(),
      });
      toast.success("Location pinned successfully!");
      setDraftPin(null);
      setName("");
      setCategory("landmark");
      setDescription("");
      loadPoints(); // Refresh list
    } catch (error) {
      toast.error("Failed to save point.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this map point?")) return;
    try {
      await deleteMapPoint(id);
      setPoints(points.filter(p => p.id !== id));
      toast.success("Point deleted.");
    } catch (error) {
      toast.error("Failed to delete point.");
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Header */}
      <div className="bg-[var(--nexora-navy)] text-white p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin size={18} className="text-red-400" /> Peza GPS Pinner
          </h2>
          <p className="text-xs text-gray-300">Click anywhere on the map to drop a pin.</p>
        </div>
        <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
          {points.length} Pins Active
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[-15.3925, 28.3322]} // Default center (change to your campus coords)
          zoom={15} 
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapEvents onMapClick={(lat, lng) => setDraftPin({ lat, lng })} />

          {/* Existing Points */}
          {points.map((point) => (
            <Marker key={point.id} position={[point.latitude, point.longitude]} icon={adminPin}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-sm">{point.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{point.category}</p>
                  {point.description && <p className="text-xs mt-1">{point.description}</p>}
                  <button 
                    onClick={() => handleDelete(point.id)}
                    className="mt-2 text-xs text-red-600 flex items-center gap-1 hover:underline"
                  >
                    <Trash2 size={12} /> Delete Pin
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Temporary Draft Pin */}
          {draftPin && (
            <Marker position={[draftPin.lat, draftPin.lng]} icon={adminPin} />
          )}
        </MapContainer>
      </div>

      {/* Add Point Modal (Overlays the map) */}
      {draftPin && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-gray-900">Name this location</h3>
              <button onClick={() => setDraftPin(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Location Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. UNZA Great East Road Gate"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value as MapPointCategory)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="landmark">Landmark</option>
                  <option value="gate">Campus Gate</option>
                  <option value="food">Food Spot</option>
                  <option value="water">Water Point</option>
                  <option value="library">Library</option>
                  <option value="safety">Safety Warning</option>
                  <option value="service">Service Area</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Cheap Nshima, opens at 10am."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setDraftPin(null)} className="px-4 py-2 text-sm font-medium text-gray-600">
                Cancel
              </button>
              <button 
                onClick={handleSavePoint}
                disabled={!name.trim() || isSaving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Save Pin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}