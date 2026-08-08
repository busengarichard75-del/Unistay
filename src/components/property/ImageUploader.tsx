"use client";

import { useState } from "react";
import { cloudinaryConfig } from "@/lib/cloudinary";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploader({
  onUploadComplete,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        cloudinaryConfig.uploadPreset
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
        onUploadComplete(data.secure_url);
      } else {
        throw new Error("Image upload failed");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm"
      />

      {uploading && (
        <p className="text-sm text-blue-600">
          Uploading image...
        </p>
      )}

      {imageUrl && (
        <div className="space-y-2">
          <p className="text-sm text-green-600">
            Image uploaded successfully
          </p>

          <img
            src={imageUrl}
            alt="Uploaded property"
            className="h-40 w-full rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}