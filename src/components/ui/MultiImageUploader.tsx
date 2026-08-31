"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, X, Loader2, ImagePlus, GripVertical, AlertCircle } from "lucide-react";

interface MultiImageUploaderProps {
  onUpload: (urls: string[]) => void;
  initialImages?: string[];
  maxImages?: number;
  className?: string;
}

export function MultiImageUploader({
  onUpload,
  initialImages = [],
  maxImages = 5,
  className = "",
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // ─── Drag-to-reorder ──────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    // Reorder the images array
    const newImages = [...images];
    const [dragged] = newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, dragged);
    setImages(newImages);
    setDragIndex(index);
    // Update parent
    onUpload(newImages);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // ─── Upload handler ──────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images.`);
      e.target.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress({});

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image file.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than 10MB.`);
        continue;
      }

      // Simulate progress (since we can't get real progress with fetch)
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

      const formData = new FormData();
      formData.append("file", file);

      try {
        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.open("POST", "/api/upload", true);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200) {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url);
            } else {
              reject(new Error("Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });

        const url = await uploadPromise;
        uploadedUrls.push(url);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
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
      {/* ─── Image grid with drag support ─── */}
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((url, index) => (
            <div
              key={url}
              draggable={true}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative cursor-grab rounded-lg border-2 border-gray-200 transition-colors ${
                dragIndex === index ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="h-24 w-full rounded-lg object-cover"
              />
              <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {index === 0 ? "Main" : `${index + 1}`}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1 right-1 text-[8px] text-gray-500">
                <GripVertical size={12} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Upload area ─── */}
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
          <span className="text-xs text-gray-400">Max 10MB per image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            multiple
            className="hidden"
          />
        </label>
      )}

      {/* ─── Upload progress (per file) ─── */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="mt-2 space-y-1">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate max-w-[120px]">{name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-8">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Error message ─── */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}