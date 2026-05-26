"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { listProducts, deleteProduct, generateQR, updateProduct } from "@/app/lib/api/products";
import type { Product } from "@/app/lib/types";
import Link from "next/link";
import { useToast } from "@/app/components/ui/toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // fallback if toast doesn't export correctly
  const toast = {
    success: (msg: string) => alert(`Success: ${msg}`),
    error: (msg: string) => alert(`Error: ${msg}`)
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await listProducts(true);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleGenerateQR = async (id: string) => {
    try {
      await generateQR(id);
      toast.success("QR generated");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to generate QR");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateProduct(id, { is_active: !current });
      toast.success(current ? "Product deactivated" : "Product activated");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link 
          href="/products/new" 
          className="bg-[var(--color-accent)] text-[var(--color-accent-text)] px-4 py-2 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Add Product
        </Link>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search products..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
        />
      </div>

      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--color-bg-tertiary)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">QR</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4 text-center text-[var(--color-text-tertiary)]">Loading...</td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                  {search ? "No matching products." : "No products yet. Add your first product!"}
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="px-4 py-3 flex items-center space-x-3">
                    <img src={product.original_image_url} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{product.variant || "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">₹{product.price}</td>
                  <td className="px-4 py-3">
                    <span className={product.inventory === 0 ? "text-[var(--color-danger)]" : product.inventory < 10 ? "text-[var(--color-warning)]" : ""}>
                      {product.inventory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleToggleActive(product.id, product.is_active)}
                      className={`px-2 py-1 text-xs rounded-full ${product.is_active ? "bg-[var(--color-success-muted)] text-[var(--color-success)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"}`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {product.qr_image_url ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-[var(--color-success-muted)] text-[var(--color-success)]">Ready</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-[var(--color-warning-muted)] text-[var(--color-warning)]">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Link href={`/products/${product.id}`} className="text-[var(--color-info)] hover:underline text-sm font-medium">Edit</Link>
                    {!product.qr_image_url && (
                      <button onClick={() => handleGenerateQR(product.id)} className="text-[var(--color-accent)] hover:underline text-sm font-medium">Gen QR</button>
                    )}
                    <button onClick={() => handleDelete(product.id)} className="text-[var(--color-danger)] hover:underline text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
