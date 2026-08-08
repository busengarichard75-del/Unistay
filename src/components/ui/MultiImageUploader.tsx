"use client";

import { useState } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";

interface MultiImageUploaderProps {
  onUpload: (urls: string[]) => void;
  initialImages?: string[];
  maxImages?: number;
  className?: string;
}

export function MultiImageUploader({
  onUpload,
  initialImages = [],
  maxImages = 3,
  className = "",
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these would exceed the limit
    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images.`);
      e.target.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image file.`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        if (data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        console.error("Upload error:", err);
      }
    }

    setIsUploading(false);
    e.target.value = "";

    if (uploadedUrls.length > 0) {
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onUpload(newImages);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onUpload(newImages);
  };

  const remainingSlots = maxImages - images.length;

  return (
    <div className={className}>
      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="h-24 w-full rounded-lg border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {remainingSlots > 0 && (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-400 ${
            isUploading ? "opacity-50" : ""
          }`}
        >
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-gray-400" />
          ) : (
            <ImagePlus size={24} className="text-gray-400" />
          )}
          <span className="mt-1 text-sm text-gray-500">
            {isUploading
              ? "Uploading..."
              : `Upload image (${images.length}/${maxImages})`}
          </span>
          <span className="text-xs text-gray-400">Max 5MB per image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            multiple
            className="hidden"
          />
        </label>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}