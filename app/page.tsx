"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import DashboardHeader from "@/components/dashboard-header";
import LiveRequests from "@/components/live-requests";
import PaidBills from "@/components/paid-bills";
import UnpaidBills from "@/components/unpaid-bills";

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<"live" | "paid" | "unpaid">("live");
  const [orders, setOrders] = useState<any[]>([]);
  const [paidBills, setPaidBills] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:5001";

    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Owner connected:", socket.id);
      socket.emit("registerRole", "owner");
    });

    socket.on("newOrder", (order) => {
      console.log("📦 New order received:", order);
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === order.id);
        return exists ? prev : [...prev, order];
      });
    });

    socket.on("orderUpdate", (updatedOrder) => {
      console.log("🔁 Order updated:", updatedOrder);

      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );

      if (updatedOrder.paymentStatus === "paid") {
        setPaidBills((prev) => {
          const exists = prev.find((b) => b.id === updatedOrder.id);
          return exists
            ? prev.map((b) => (b.id === updatedOrder.id ? updatedOrder : b))
            : [...prev, updatedOrder];
        });
      } else {
        setPaidBills((prev) => prev.filter((b) => b.id !== updatedOrder.id));
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Owner disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAcceptOrder = (id: string) => {
    if (!socketRef.current) return;
    console.log(`👑 Accepting order: ${id}`);
    socketRef.current.emit("acceptOrder", id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    showToast("✅ Order accepted!", "success");
  };

  const handleDeclineOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    showToast("❌ Order declined", "error");
  };

  const handleMarkAsPaid = (id: string) => {
    if (!socketRef.current) return;
    console.log(`💳 Marking order ${id} as paid`);
    socketRef.current.emit("updatePaymentStatus", {
      orderId: id,
      paymentStatus: "paid",
    });
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "paid");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Tabs */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: "live", label: "Live Requests" },
              { id: "paid", label: "Paid Bills" },
              { id: "unpaid", label: "Unpaid Bills" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-2 font-medium text-sm relative transition-colors ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "live" && (
            <LiveRequests
              key="live"
              orders={orders}
              onAccept={handleAcceptOrder}
              onDecline={handleDeclineOrder}
            />
          )}
          {activeTab === "paid" && <PaidBills key="paid" bills={paidBills} />}
          {activeTab === "unpaid" && (
            <UnpaidBills
              key="unpaid"
              orders={unpaidOrders}
              onMarkAsPaid={handleMarkAsPaid}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
