"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  initialImage?: string;
  className?: string;
}

export function ImageUploader({
  onUpload,
  initialImage = "",
  className = "",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setIsUploading(true);

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
        setPreview(data.url);
        onUpload(data.url);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    setPreview("");
    onUpload("");
    setError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Property preview"
            className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-400 ${
            isUploading ? "opacity-50" : ""
          }`}
        >
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-gray-400" />
          ) : (
            <Upload size={24} className="text-gray-400" />
          )}
          <span className="mt-1 text-sm text-gray-500">
            {isUploading ? "Uploading..." : "Click to upload image"}
          </span>
          <span className="text-xs text-gray-400">Max 5MB</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}