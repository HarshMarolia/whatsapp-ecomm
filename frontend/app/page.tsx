"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { listProducts } from "@/app/lib/api/products";
import { listCustomers } from "@/app/lib/api/customers";
import { listOrders } from "@/app/lib/api/orders";
import type { Product, Customer, Order } from "@/app/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodData, custData, ordData] = await Promise.all([
          listProducts(true),
          listCustomers(),
          listOrders(),
        ]);
        setProducts(prodData);
        setCustomers(custData);
        setOrders(ordData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeProducts = products.filter((p) => p.is_active).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold animate-fade-in stagger-1">Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in stagger-2">
          {[
            { label: "Total Products", value: products.length, icon: "📦" },
            { label: "Active Products", value: activeProducts, icon: "✅" },
            { label: "Total Customers", value: customers.length, icon: "👥" },
            { label: "Total Orders", value: orders.length, icon: "🧾" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] flex items-center space-x-4 transition-transform hover:-translate-y-1"
              style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-accent-muted)] text-xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                <p className="text-2xl font-bold">{loading ? "-" : stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <div className="animate-fade-in stagger-3">
            <h2 className="text-lg font-semibold mb-4">Recent Products</h2>
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--color-bg-tertiary)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-[var(--color-text-tertiary)]">Loading...</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                        No products yet. <Link href="/products/new" className="text-[var(--color-accent)] hover:underline">Add one</Link>
                      </td>
                    </tr>
                  ) : (
                    products.slice(0, 5).map((product) => (
                      <tr key={product.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="px-4 py-3 flex items-center space-x-3">
                          <img src={product.original_image_url} alt={product.name} className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{product.variant || "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">₹{product.price}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${product.is_active ? "bg-[var(--color-success-muted)] text-[var(--color-success)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"}`}>
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Customers */}
          <div className="animate-fade-in stagger-4">
            <h2 className="text-lg font-semibold mb-4">Recent Customers</h2>
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--color-bg-tertiary)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-[var(--color-text-tertiary)]">Loading...</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                        No customers yet.
                      </td>
                    </tr>
                  ) : (
                    customers.slice(0, 5).map((customer) => (
                      <tr key={customer.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-mono text-sm">{customer.whatsapp_number}</td>
                        <td className="px-4 py-3">{customer.name || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
