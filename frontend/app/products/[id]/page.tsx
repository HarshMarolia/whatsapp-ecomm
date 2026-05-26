"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { getProduct, updateProduct, deleteProduct, generateQR, getUploadSignature } from "@/app/lib/api/products";
import type { Product } from "@/app/lib/types";
import Link from "next/link";
import { useToast } from "@/app/components/ui/toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    variant: "",
    inventory: "0",
    original_image_url: "",
    is_active: true
  });
  
  // fallback if toast doesn't export correctly
  const toast = {
    success: (msg: string) => alert(`Success: ${msg}`),
    error: (msg: string) => alert(`Error: ${msg}`)
  };

  const fetchProduct = async () => {
    try {
      const data = await getProduct(id);
      setProduct(data);
      setFormData({
        name: data.name,
        price: data.price.toString(),
        variant: data.variant || "",
        inventory: data.inventory.toString(),
        original_image_url: data.original_image_url,
        is_active: data.is_active
      });
    } catch (err) {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

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
    setSaving(true);
    try {
      await updateProduct(id, {
        name: formData.name,
        price: parseFloat(formData.price),
        variant: formData.variant || null,
        inventory: parseInt(formData.inventory) || 0,
        original_image_url: formData.original_image_url,
        is_active: formData.is_active
      });
      toast.success("Product updated");
      fetchProduct();
    } catch (err) {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      router.push("/products");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleGenerateQR = async () => {
    try {
      await generateQR(id);
      toast.success("QR generated");
      fetchProduct();
    } catch (err) {
      toast.error("Failed to generate QR");
    }
  };

  if (loading) {
    return <DashboardLayout><p className="text-[var(--color-text-secondary)]">Loading...</p></DashboardLayout>;
  }

  if (!product) {
    return <DashboardLayout><p className="text-[var(--color-danger)]">Product not found</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/products" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm mb-2 inline-flex items-center">
          &larr; Back to Products
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <span className="text-xs text-[var(--color-text-tertiary)] font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">ID: {product.fallback_product_id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
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
              
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_active}
                  onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                  className={`w-11 h-6 flex items-center rounded-full transition-colors ${formData.is_active ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-tertiary)]'}`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-[var(--color-text-primary)]">Active Status</span>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <button 
                  type="submit" 
                  disabled={saving || uploading}
                  className="w-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-4 py-2.5 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <button 
              onClick={handleDelete}
              className="w-full bg-[var(--color-danger-muted)] text-[var(--color-danger)] px-4 py-2.5 rounded-md font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors"
            >
              Delete Product
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
            <h3 className="font-semibold text-lg mb-4">QR Code</h3>
            {product.qr_image_url ? (
              <div className="flex flex-col items-center">
                <img src={product.qr_image_url} alt="QR Code" className="w-48 h-48 bg-white p-2 rounded-md mb-4" />
                <a 
                  href={product.qr_image_url} 
                  download 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-[var(--color-accent)] hover:underline font-medium"
                >
                  Download QR Code
                </a>
                <div className="mt-4 p-3 bg-[var(--color-bg-primary)] rounded w-full overflow-x-auto text-xs text-[var(--color-text-secondary)] font-mono break-all">
                  {product.qr_payload}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[var(--color-text-secondary)] mb-4 text-sm">No QR code generated yet. This product cannot be purchased via image match until it has a QR code.</p>
                <button 
                  onClick={handleGenerateQR}
                  className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  Generate QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
