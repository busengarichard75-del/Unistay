"use client";

import { useState, useEffect } from "react";
import { Room, BedSpace } from "@/types/property";
import { X, Plus } from "lucide-react";

interface RoomBuilderProps {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
}

export function RoomBuilder({ rooms, onChange }: RoomBuilderProps) {
  // Number of rooms (derived from rooms array length)
  const [roomCount, setRoomCount] = useState<number>(rooms.length || 1);

  // When roomCount changes, adjust the rooms array
  useEffect(() => {
    const currentCount = rooms.length;
    if (roomCount > currentCount) {
      // Add new rooms
      const newRooms: Room[] = [];
      for (let i = currentCount + 1; i <= roomCount; i++) {
        newRooms.push({
          id: `room-${Date.now()}-${i}`,
          name: `Room ${i}`,
          bedCount: 1,
          bedSpaces: [
            {
              id: `bed-${Date.now()}-${i}-1`,
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

  // Update beds in a specific room
  const handleBedCountChange = (roomIndex: number, newBedCount: number) => {
    const updated = [...rooms];
    const room = updated[roomIndex];
    const currentBeds = room.bedSpaces.length;
    if (newBedCount > currentBeds) {
      // Add beds
      for (let i = currentBeds + 1; i <= newBedCount; i++) {
        room.bedSpaces.push({
          id: `bed-${Date.now()}-${roomIndex}-${i}`,
          isAvailable: true,
          type: "Top",
        });
      }
    } else if (newBedCount < currentBeds) {
      // Remove last beds
      room.bedSpaces = room.bedSpaces.slice(0, newBedCount);
    }
    // Update bedCount for UI convenience
    room.bedCount = room.bedSpaces.length;
    onChange(updated);
  };

  // Remove a specific bed from a room
  const removeBed = (roomIndex: number, bedIndex: number) => {
    const updated = [...rooms];
    const room = updated[roomIndex];
    room.bedSpaces.splice(bedIndex, 1);
    room.bedCount = room.bedSpaces.length;
    onChange(updated);
  };

  // Update bed type (Top / Bottom)
  const updateBedType = (roomIndex: number, bedIndex: number, newType: "Top" | "Bottom") => {
    const updated = [...rooms];
    updated[roomIndex].bedSpaces[bedIndex].type = newType;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Number of Rooms Input */}
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium text-gray-700">Number of Rooms</label>
        <input
          type="number"
          min={1}
          value={roomCount}
          onChange={(e) => {
            const val = Math.max(1, Number(e.target.value));
            setRoomCount(val);
          }}
          className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
        />
      </div>

      {/* Room Cards */}
      <div className="space-y-4">
        {rooms.map((room, roomIndex) => (
          <div
            key={room.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">{room.name}</h4>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Beds in {room.name}</label>
                <input
                  type="number"
                  min={0}
                  value={room.bedSpaces.length}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    handleBedCountChange(roomIndex, val);
                  }}
                  className="w-16 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
                />
              </div>
            </div>

            {/* Bed rows */}
            <div className="space-y-2">
              {room.bedSpaces.map((bed, bedIndex) => (
                <div
                  key={bed.id}
                  className="flex items-center gap-2 rounded bg-white p-2 shadow-sm"
                >
                  <span className="text-xs font-medium text-gray-600 w-14">
                    Bed {bedIndex + 1}
                  </span>
                  <select
                    value={bed.type || "Top"}
                    onChange={(e) =>
                      updateBedType(roomIndex, bedIndex, e.target.value as "Top" | "Bottom")
                    }
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[var(--nexora-primary)]"
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
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}