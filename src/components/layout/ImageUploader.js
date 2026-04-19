"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Upload, Camera } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

export default function ImageUploader({ value, onChange, label = "Image" }) {
  const [preview, setPreview] = useState(value || "");
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  const handleFile = async (file, input) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      if (input) input.value = "";
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Max file size is 5MB");
      if (input) input.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);

      const response = await fetcher("/files/upload", "POST", formData);
      const imageUrl = response?.url;

      if (!response?.success || !imageUrl) {
        throw new Error("Image upload failed");
      }

      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (error) {
      alert(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (input) input.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {/* <Label>{label}</Label> */}

      <div className="flex items-center gap-4">
        {preview && (
          <Image
            src={preview}
            alt="Preview"
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg object-cover border"
          />
        )}

      

        {/* Upload Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileRef.current.click()}
          className="h-9 flex items-center gap-2 px-4 py-1 rounded-md border border-dashed border-input hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : "Upload"}
          </span>
        </button>

        {/* Hidden Inputs */}

        {/* Camera (mobile will open camera) */}
        <Input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFile(e.target.files?.[0], e.target)}
          className="hidden"
        />

        {/* File Picker */}
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0], e.target)}
          className="hidden"
        />
      </div>
    </div>
  );
}
