"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { listOrders, updateOrderStatus } from "@/app/lib/api/orders";
import type { Order } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/toast";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // fallback if toast doesn't export correctly
  const toast = {
    success: (msg: string) => alert(`Success: ${msg}`),
    error: (msg: string) => alert(`Error: ${msg}`)
  };

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      const data = await listOrders(status === "ALL" ? undefined : status);
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateOrderStatus(id, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders(activeTab);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const tabs = [
    { id: "ALL", label: "All Orders" },
    { id: "PENDING_COD", label: "Pending COD" },
    { id: "CONFIRMED", label: "Confirmed" },
    { id: "CANCELLED", label: "Cancelled" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_COD":
        return <span className="bg-[var(--color-warning-muted)] text-[var(--color-warning)] px-2 py-1 text-xs rounded-full font-medium">Pending</span>;
      case "CONFIRMED":
        return <span className="bg-[var(--color-success-muted)] text-[var(--color-success)] px-2 py-1 text-xs rounded-full font-medium">Confirmed</span>;
      case "CANCELLED":
        return <span className="bg-[var(--color-danger-muted)] text-[var(--color-danger)] px-2 py-1 text-xs rounded-full font-medium">Cancelled</span>;
      default:
        return <span className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] px-2 py-1 text-xs rounded-full font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold">Orders</h1>
          <span className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs px-2.5 py-1 rounded-full font-medium">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]" 
                : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--color-bg-tertiary)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3 hidden sm:table-cell">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {loading ? (
              [1,2,3,4].map(i => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4 text-center text-[var(--color-text-tertiary)]">Loading...</td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                  No orders found. Orders will appear here when customers complete checkout.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-sm" title={order.id}>{order.id.substring(0,8)}...</td>
                    <td className="px-4 py-3 font-mono text-sm hidden sm:table-cell" title={order.customer_id}>{order.customer_id.substring(0,8)}...</td>
                    <td className="px-4 py-3 text-sm">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 font-medium">₹{order.total_amount}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 space-x-2" onClick={(e) => e.stopPropagation()}>
                      {order.status === "PENDING_COD" && (
                        <>
                          <button onClick={() => handleStatusChange(order.id, "CONFIRMED")} className="text-[var(--color-success)] hover:underline text-sm font-medium">Confirm</button>
                          <button onClick={() => handleStatusChange(order.id, "CANCELLED")} className="text-[var(--color-danger)] hover:underline text-sm font-medium">Cancel</button>
                        </>
                      )}
                      {order.status === "CONFIRMED" && (
                        <button onClick={() => handleStatusChange(order.id, "CANCELLED")} className="text-[var(--color-danger)] hover:underline text-sm font-medium">Cancel</button>
                      )}
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr className="bg-[var(--color-bg-tertiary)]">
                      <td colSpan={6} className="px-4 py-4 border-t border-[var(--color-border-subtle)]">
                        <div className="flex justify-between items-start">
                          <div className="w-full max-w-3xl">
                            <h4 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)] mb-3">Order Items ({order.items.length})</h4>
                            <div className="bg-[var(--color-bg-primary)] rounded border border-[var(--color-border-subtle)] overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium">Product ID</th>
                                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                                    <th className="px-3 py-2 text-left font-medium">Price</th>
                                    <th className="px-3 py-2 text-left font-medium">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                                  {order.items.map(item => (
                                    <tr key={item.id}>
                                      <td className="px-3 py-2 font-mono" title={item.product_id}>{item.product_id.substring(0,12)}...</td>
                                      <td className="px-3 py-2">{item.quantity}</td>
                                      <td className="px-3 py-2">₹{item.price_at_purchase}</td>
                                      <td className="px-3 py-2 font-medium">₹{item.quantity * item.price_at_purchase}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-[var(--color-bg-hover)]">
                                    <td colSpan={3} className="px-3 py-2 text-right font-medium">Order Total</td>
                                    <td className="px-3 py-2 font-bold">₹{order.total_amount}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                            className="ml-4 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border-subtle)]"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
