"use client";

import { useState, useEffect } from "react";
import { Room, BedSpace } from "@/types/property";
import { X, Plus, Copy, Bed, Home, Layers, Wand2, ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface RoomBuilderProps {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
}

// ─── Helper: Generate unique ID ───
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

// ─── Helper: Get next room number ───
function getNextRoomNumber(rooms: Room[]): number {
  const numbers = rooms
    .map((r) => {
      const match = r.name.match(/Room (\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  return numbers.length > 0 ? Math.max(...numbers) + 1 : rooms.length + 1;
}

export function RoomBuilder({ rooms, onChange }: RoomBuilderProps) {
  // ─── Room count state ───
  const [roomCount, setRoomCount] = useState<number>(rooms.length || 1);

  // ─── Quick Add state ───
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddRooms, setQuickAddRooms] = useState(1);
  const [quickAddBeds, setQuickAddBeds] = useState(1);
  const [quickAddBunkPattern, setQuickAddBunkPattern] = useState<"allTop" | "allBottom" | "alternate">("alternate");

  // ─── Room name editing state ───
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);
  const [editingRoomName, setEditingRoomName] = useState("");

  // ─── When roomCount changes, adjust the rooms array ───
  useEffect(() => {
    const currentCount = rooms.length;
    if (roomCount > currentCount) {
      // Add new rooms
      const nextNumber = getNextRoomNumber(rooms);
      const newRooms: Room[] = [];
      for (let i = 0; i < roomCount - currentCount; i++) {
        const roomNumber = nextNumber + i;
        newRooms.push({
          id: generateId("room"),
          name: `Room ${roomNumber}`,
          bedCount: 1,
          bedSpaces: [
            {
              id: generateId("bed"),
              isAvailable: true,
              type: "Top",
            },
          ],
        });
      }
      onChange([...rooms, ...newRooms]);
    } else if (roomCount < currentCount) {
      // Remove last rooms
      const trimmed = rooms.slice(0, roomCount);
      onChange(trimmed);
    }
  }, [roomCount]);

  // ─── Quick Add: Generate multiple rooms at once ───
  const handleQuickAdd = () => {
    if (quickAddRooms < 1 || quickAddBeds < 1) {
      toast.error("Please enter at least 1 room and 1 bed per room.");
      return;
    }

    const nextNumber = getNextRoomNumber(rooms);
    const newRooms: Room[] = [];

    for (let i = 0; i < quickAddRooms; i++) {
      const roomNumber = nextNumber + i;
      const bedSpaces: BedSpace[] = [];

      for (let j = 0; j < quickAddBeds; j++) {
        let type: "Top" | "Bottom" = "Top";

        if (quickAddBunkPattern === "allTop") {
          type = "Top";
        } else if (quickAddBunkPattern === "allBottom") {
          type = "Bottom";
        } else if (quickAddBunkPattern === "alternate") {
          type = j % 2 === 0 ? "Top" : "Bottom";
        }

        bedSpaces.push({
          id: generateId("bed"),
          isAvailable: true,
          type,
        });
      }

      newRooms.push({
        id: generateId("room"),
        name: `Room ${roomNumber}`,
        bedCount: bedSpaces.length,
        bedSpaces,
      });
    }

    onChange([...rooms, ...newRooms]);
    setShowQuickAdd(false);
    toast.success(`${quickAddRooms} room(s) added successfully! 🎉`);
  };

  // ─── Update beds in a specific room ───
  const handleBedCountChange = (roomIndex: number, newBedCount: number) => {
    if (newBedCount < 0) return;
    const updated = [...rooms];
    const room = updated[roomIndex];
    const currentBeds = room.bedSpaces.length;

    if (newBedCount > currentBeds) {
      // Add beds
      for (let i = currentBeds; i < newBedCount; i++) {
        room.bedSpaces.push({
          id: generateId("bed"),
          isAvailable: true,
          type: i % 2 === 0 ? "Top" : "Bottom",
        });
      }
    } else if (newBedCount < currentBeds) {
      // Remove last beds
      room.bedSpaces = room.bedSpaces.slice(0, newBedCount);
    }
    room.bedCount = room.bedSpaces.length;
    onChange(updated);
  };

  // ─── Remove a specific bed from a room ───
  const removeBed = (roomIndex: number, bedIndex: number) => {
    if (rooms[roomIndex].bedSpaces.length <= 1) {
      toast.warning("Cannot remove the last bed. Remove the entire room instead.");
      return;
    }
    const updated = [...rooms];
    const room = updated[roomIndex];
    room.bedSpaces.splice(bedIndex, 1);
    room.bedCount = room.bedSpaces.length;
    onChange(updated);
  };

  // ─── Update bed type (Top / Bottom) ───
  const updateBedType = (roomIndex: number, bedIndex: number, newType: "Top" | "Bottom") => {
    const updated = [...rooms];
    updated[roomIndex].bedSpaces[bedIndex].type = newType;
    onChange(updated);
  };

  // ─── Delete an entire room ───
  const deleteRoom = (roomIndex: number) => {
    if (rooms.length <= 1) {
      toast.warning("You need at least one room.");
      return;
    }
    if (!window.confirm(`Delete "${rooms[roomIndex].name}"? This cannot be undone.`)) return;
    const updated = rooms.filter((_, i) => i !== roomIndex);
    onChange(updated);
    setRoomCount(updated.length);
    toast.success("Room deleted.");
  };

  // ─── Start editing room name ───
  const startEditingName = (roomIndex: number) => {
    setEditingRoomIndex(roomIndex);
    setEditingRoomName(rooms[roomIndex].name);
  };

  // ─── Save edited room name ───
  const saveRoomName = (roomIndex: number) => {
    if (!editingRoomName.trim()) {
      toast.error("Room name cannot be empty.");
      return;
    }
    const updated = [...rooms];
    updated[roomIndex].name = editingRoomName.trim();
    onChange(updated);
    setEditingRoomIndex(null);
    setEditingRoomName("");
  };

  // ─── Cancel editing ───
  const cancelEditingName = () => {
    setEditingRoomIndex(null);
    setEditingRoomName("");
  };

  // ─── Duplicate a room ───
  const duplicateRoom = (roomIndex: number) => {
    const original = rooms[roomIndex];
    const nextNumber = getNextRoomNumber(rooms);
    const newRoom: Room = {
      ...original,
      id: generateId("room"),
      name: `Room ${nextNumber}`,
      bedSpaces: original.bedSpaces.map((bed) => ({
        ...bed,
        id: generateId("bed"),
      })),
    };
    const updated = [...rooms, newRoom];
    onChange(updated);
    setRoomCount(updated.length);
    toast.success(`Duplicated "${original.name}"`);
  };

  return (
    <div className="space-y-4">
      {/* ─── Top Controls ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Number of Rooms</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm hover:bg-gray-50"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={roomCount}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value));
                setRoomCount(val);
              }}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            />
            <button
              type="button"
              onClick={() => setRoomCount(roomCount + 1)}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700 shadow-sm"
          >
            <Wand2 size={16} />
            Quick Add Rooms
          </button>
        </div>
      </div>

      {/* ─── Quick Add Panel ─── */}
      {showQuickAdd && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Plus size={16} />
              Quick Add Multiple Rooms
            </h4>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="rounded-full p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-blue-700">Number of Rooms</label>
              <input
                type="number"
                min={1}
                value={quickAddRooms}
                onChange={(e) => setQuickAddRooms(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-700">Beds per Room</label>
              <input
                type="number"
                min={1}
                value={quickAddBeds}
                onChange={(e) => setQuickAddBeds(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-700">Bunk Pattern</label>
              <select
                value={quickAddBunkPattern}
                onChange={(e) => setQuickAddBunkPattern(e.target.value as "allTop" | "allBottom" | "alternate")}
                className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="alternate">Alternate (Top/Bottom)</option>
                <option value="allTop">All Top Bunks</option>
                <option value="allBottom">All Bottom Bunks</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              className="rounded-lg bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--nexora-primary-hover)] transition-colors"
            >
              Generate Rooms
            </button>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="mt-2 text-[10px] text-blue-500">
            Rooms will be named sequentially (e.g., Room 6, Room 7, ...)
          </p>
        </div>
      )}

      {/* ─── Room Cards ─── */}
      <div className="space-y-4">
        {rooms.map((room, roomIndex) => {
          const totalBeds = room.bedSpaces.length;
          const isEditing = editingRoomIndex === roomIndex;

          return (
            <div
              key={room.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* ─── Room Header ─── */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Home size={16} className="text-[var(--nexora-primary)]" />
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingRoomName}
                        onChange={(e) => setEditingRoomName(e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveRoomName(roomIndex)}
                        className="rounded-lg bg-green-600 p-1 text-white hover:bg-green-700"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingName}
                        className="rounded-lg bg-gray-200 p-1 text-gray-600 hover:bg-gray-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold text-gray-800">{room.name}</h4>
                      <button
                        type="button"
                        onClick={() => startEditingName(roomIndex)}
                        className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Edit room name"
                      >
                        <Pencil size={12} />
                      </button>
                    </>
                  )}
                  <span className="text-xs text-gray-400">
                    ({totalBeds} bed{totalBeds !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => duplicateRoom(roomIndex)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Duplicate room"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoom(roomIndex)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete room"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* ─── Bed Controls ─── */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                <label className="text-xs font-medium text-gray-500">Beds</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleBedCountChange(roomIndex, Math.max(0, totalBeds - 1))}
                    className="rounded border border-gray-200 px-2 py-0.5 text-sm hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm font-medium text-gray-700">{totalBeds}</span>
                  <button
                    type="button"
                    onClick={() => handleBedCountChange(roomIndex, totalBeds + 1)}
                    className="rounded border border-gray-200 px-2 py-0.5 text-sm hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400">beds in {room.name}</span>
              </div>

              {/* ─── Bed List ─── */}
              <div className="mt-3 space-y-2">
                {room.bedSpaces.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No beds. Add a bed to get started.</p>
                ) : (
                  room.bedSpaces.map((bed, bedIndex) => (
                    <div
                      key={bed.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1.5">
                        <Bed size={14} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-600 min-w-12">
                          Bed {bedIndex + 1}
                        </span>
                      </div>
                      <select
                        value={bed.type || "Top"}
                        onChange={(e) =>
                          updateBedType(roomIndex, bedIndex, e.target.value as "Top" | "Bottom")
                        }
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20 min-w-[100px]"
                      >
                        <option value="Top">Top Bunk</option>
                        <option value="Bottom">Bottom Bunk</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeBed(roomIndex, bedIndex)}
                        className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Remove bed"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}