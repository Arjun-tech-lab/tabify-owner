"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import DashboardHeader from "@/components/dashboard-header";
import LiveRequests from "@/components/live-requests";
import PaidBills from "@/components/paid-bills";
import UnpaidBills from "@/components/unpaid-bills";

/* ================= TYPES ================= */
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userName: string;
  phone: string;
  items: OrderItem[];
  totalAmount: number;
  status: "requested" | "accepted" | "completed";
  paymentStatus: "paid" | "unpaid";
  createdAt: string;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<
    "live" | "paid" | "unpaid" | "history"
  >("live");

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  /* ================= SOCKET ================= */
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("registerRole", "owner");
    });

    // 🔔 New incoming order
    socket.on("newOrder", (order: Order) => {
      if (order.status === "requested") {
        setLiveOrders((prev) =>
          prev.find((o) => o._id === order._id)
            ? prev
            : [order, ...prev]
        );
      }
    });

    // 🔁 Order updated (accepted / paid / completed)
    socket.on("orderUpdate", (updated: Order) => {
      // remove from live
      setLiveOrders((prev) =>
        prev.filter((o) => o._id !== updated._id)
      );

      // update history instantly
      setHistoryOrders((prev) => {
        const exists = prev.find((o) => o._id === updated._id);
        return exists
          ? prev.map((o) =>
              o._id === updated._id ? updated : o
            )
          : [updated, ...prev];
      });
    });

    return () => socket.disconnect();
  }, []);

  /* ================= ACTIONS ================= */
  const handleAcceptOrder = (id: string) => {
    socketRef.current?.emit("acceptOrder", id);
  };

  const handleDeclineOrder = (id: string) => {
    setLiveOrders((prev) => prev.filter((o) => o._id !== id));
  };

  const handleMarkAsPaid = (id: string) => {
    socketRef.current?.emit("updatePaymentStatus", {
      orderId: id,
      paymentStatus: "paid",
    });
  };

  /* ================= HISTORY (OWNER = ALL ORDERS) ================= */
  useEffect(() => {
    if (activeTab !== "history") return;

    setLoadingHistory(true);

    fetch(`${BACKEND_URL}/api/orders/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistoryOrders(data.orders);
        }
      })
      .finally(() => setLoadingHistory(false));
  }, [activeTab]);

  /* ================= DERIVED ================= */
  const unpaidOrders = historyOrders.filter(
    (o) => o.paymentStatus === "unpaid"
  );

  const paidOrders = historyOrders.filter(
    (o) => o.paymentStatus === "paid"
  );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Tabs */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {[
            { id: "live", label: "Live Requests" },
            { id: "paid", label: "Paid Bills" },
            { id: "unpaid", label: "Unpaid Bills" },
            { id: "history", label: "History" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as typeof activeTab)
              }
              className="py-4 relative font-medium"
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "live" && (
            <LiveRequests
              orders={liveOrders}
              onAccept={handleAcceptOrder}
              onDecline={handleDeclineOrder}
            />
          )}

          {activeTab === "paid" && (
            <PaidBills bills={paidOrders} />
          )}

          {activeTab === "unpaid" && (
            <UnpaidBills
              orders={unpaidOrders}
              onMarkAsPaid={handleMarkAsPaid}
            />
          )}

          {activeTab === "history" && (
            <motion.div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary">
                🧾 All Orders History
              </h2>

              {loadingHistory && <p>Loading history...</p>}

              {!loadingHistory &&
                historyOrders.map((order) => (
                  <div
                    key={order._id}
                    className="border rounded-2xl p-5 bg-card"
                  >
                    <p className="font-semibold">{order.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      📞 {order.phone}
                    </p>
                    <p>Status: {order.status}</p>
                    <p>Total: ₹{order.totalAmount}</p>
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
