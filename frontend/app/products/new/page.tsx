"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { createProduct, getUploadSignature } from "@/app/lib/api/products";
import Link from "next/link";
import { useToast } from "@/app/components/ui/toast";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    variant: "",
    inventory: "0",
    original_image_url: ""
  });
  
  // fallback if toast doesn't export correctly
  const toast = {
    success: (msg: string) => alert(`Success: ${msg}`),
    error: (msg: string) => alert(`Error: ${msg}`)
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const sigData = await getUploadSignature();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sigData.api_key);
      form.append("timestamp", sigData.timestamp.toString());
      form.append("signature", sigData.signature);
      form.append("folder", sigData.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
        method: "POST",
        body: form
      });

      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, original_image_url: data.secure_url }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (err) {
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.original_image_url) {
      toast.error("Name, price, and image are required");
      return;
    }
    setLoading(true);
    try {
      await createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        variant: formData.variant || undefined,
        inventory: parseInt(formData.inventory) || 0,
        original_image_url: formData.original_image_url
      });
      toast.success("Product created");
      router.push("/products");
    } catch (err) {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/products" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm mb-2 inline-flex items-center">
          &larr; Back to Products
        </Link>
        <h1 className="text-2xl font-bold">New Product</h1>
      </div>

      <div className="max-w-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Product Name *</label>
            <input 
              type="text" 
              name="name" 
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Price (₹) *</label>
              <input 
                type="number" 
                name="price" 
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Inventory</label>
              <input 
                type="number" 
                name="inventory" 
                min="0"
                value={formData.inventory}
                onChange={handleChange}
                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Variant (Optional)</label>
            <input 
              type="text" 
              name="variant" 
              placeholder="e.g. Red / XL"
              value={formData.variant}
              onChange={handleChange}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Product Image *</label>
            <div className="border-2 dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center hover:border-[var(--color-accent)] transition-colors relative">
              {uploading ? (
                <p className="text-[var(--color-text-secondary)]">Uploading...</p>
              ) : formData.original_image_url ? (
                <div className="flex flex-col items-center">
                  <img src={formData.original_image_url} alt="Preview" className="w-32 h-32 object-cover rounded-md mb-3" />
                  <p className="text-sm text-[var(--color-text-secondary)]">Click to replace</p>
                </div>
              ) : (
                <p className="text-[var(--color-text-secondary)]">Click to select an image file</p>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="w-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-4 py-2.5 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
