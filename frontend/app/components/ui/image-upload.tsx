"use client";

import React, { useState, useRef, useCallback } from "react";
import { getUploadSignature } from "@/app/lib/api/products";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const UploadCloudIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImageUpload({ onUploadComplete, currentImageUrl, className = "" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- Upload handler ---- */
  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);

      // Create preview
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      try {
        // 1) Get signed params from our API
        const signatureData = await getUploadSignature();

        // 2) Build FormData for Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureData.api_key);
        formData.append("timestamp", String(signatureData.timestamp));
        formData.append("signature", signatureData.signature);
        if (signatureData.folder) formData.append("folder", signatureData.folder);

        // 3) Upload with progress via XMLHttpRequest
        const url = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`;

        const secureUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              resolve(data.secure_url);
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(formData);
        });

        setPreview(secureUrl);
        onUploadComplete(secureUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(currentImageUrl || null);
      } finally {
        setUploading(false);
        URL.revokeObjectURL(localPreview);
      }
    },
    [currentImageUrl, onUploadComplete]
  );

  /* ---- Event handlers ---- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onUploadComplete("");
  };

  /* ---- Render ---- */
  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        id="image-upload-input"
        onChange={handleFileChange}
      />

      {/* If we have a preview, show it */}
      {preview ? (
        <div
          className="relative rounded-xl overflow-hidden group"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-tertiary)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded preview"
            className="w-full h-48 object-cover"
          />

          {/* Overlay controls */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <button
              id="image-upload-replace"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-text-inverse)",
              }}
            >
              Replace
            </button>
            <button
              id="image-upload-delete"
              onClick={handleRemove}
              className="p-1.5 rounded-lg transition-colors duration-150"
              style={{
                background: "var(--color-danger-muted)",
                color: "var(--color-danger)",
              }}
            >
              <TrashIcon />
            </button>
          </div>

          {/* Upload progress bar */}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "var(--color-bg-tertiary)" }}>
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "var(--color-accent)",
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* Dropzone */
        <button
          id="image-upload-dropzone"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center w-full h-48 rounded-xl cursor-pointer transition-all duration-200"
          style={{
            border: `2px dashed ${dragActive ? "var(--color-accent)" : "var(--color-border)"}`,
            background: dragActive ? "var(--color-accent-muted)" : "var(--color-bg-tertiary)",
          }}
        >
          <span style={{ color: "var(--color-text-tertiary)" }}>
            <UploadCloudIcon />
          </span>
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {uploading ? `Uploading… ${progress}%` : "Click or drag image to upload"}
          </p>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            PNG, JPG, WEBP up to 5MB
          </p>
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
