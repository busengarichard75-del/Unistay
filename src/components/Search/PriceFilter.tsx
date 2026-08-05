"use client";

interface PriceFilterProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function PriceFilter({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceFilterProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <input
        type="number"
        value={minPrice}
        onChange={(e) => onMinChange(e.target.value)}
        placeholder="Min price"
        className="w-28 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400"
      />
      <span className="text-sm text-gray-400">to</span>
      <input
        type="number"
        value={maxPrice}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder="Max price"
        className="w-28 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}