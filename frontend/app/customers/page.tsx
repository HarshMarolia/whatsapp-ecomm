"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { listCustomers } from "@/app/lib/api/customers";
import type { Customer } from "@/app/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await listCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatPhone = (phone: string) => {
    if (!phone) return "—";
    // Assuming format like 919876543210 -> +91 98765 43210
    if (phone.length > 10) {
      const cc = phone.substring(0, phone.length - 10);
      const rest = phone.substring(phone.length - 10);
      return `+${cc} ${rest.substring(0, 5)} ${rest.substring(5)}`;
    }
    return phone;
  };

  const filteredCustomers = customers.filter(c => 
    c.whatsapp_number.includes(search) || 
    (c.name && c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold">Customers</h1>
          <span className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs px-2.5 py-1 rounded-full font-medium">
            {customers.length}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search by name or number..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
        />
      </div>

      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--color-bg-tertiary)] text-xs uppercase text-[var(--color-text-tertiary)] tracking-wider">
            <tr>
              <th className="px-4 py-3">WhatsApp Number</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Address Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {loading ? (
              [1,2,3,4].map(i => (
                <tr key={i}>
                  <td colSpan={3} className="px-4 py-4 text-center text-[var(--color-text-tertiary)]">Loading...</td>
                </tr>
              ))
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                  {search ? "No matching customers." : "No customers yet. Customers will appear here when they message your WhatsApp bot."}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <React.Fragment key={customer.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                    className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-sm">{formatPhone(customer.whatsapp_number)}</td>
                    <td className="px-4 py-3 font-medium">{customer.name || "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {customer.delivery_address && customer.delivery_address.city ? (
                        <span className="text-sm truncate max-w-xs block">{customer.delivery_address.city}, {customer.delivery_address.pincode}</span>
                      ) : (
                        <span className="text-sm text-[var(--color-text-secondary)]">No address</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === customer.id && (
                    <tr className="bg-[var(--color-bg-tertiary)]">
                      <td colSpan={3} className="px-4 py-4 border-t border-[var(--color-border-subtle)]">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)] mb-2">Delivery Details</h4>
                            {customer.delivery_address ? (
                              <pre className="text-sm font-mono bg-[var(--color-bg-primary)] p-3 rounded-md text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] overflow-auto max-w-2xl">
                                {JSON.stringify(customer.delivery_address, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-sm text-[var(--color-text-tertiary)]">Customer has not provided a delivery address yet.</p>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                            className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border-subtle)]"
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
