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

type Tab = "live" | "paid" | "unpaid" | "history";
type PaginatedTab = Exclude<Tab, "live">;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

const LIMIT = 10;

const endpointMap: Record<PaginatedTab, string> = {
  history: "/api/orders/all",
  paid: "/api/orders/paid",
  unpaid: "/api/orders/unpaid",
};

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const activeTabRef = useRef<Tab>(activeTab);


  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
  activeTabRef.current = activeTab;
}, [activeTab]);


  /* ================= SOCKET ================= */
  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("registerRole", "owner");
    });

    socket.on("newOrder", (order: Order) => {
      if (order.status === "requested") {
        setLiveOrders((prev) =>
          prev.find((o) => o._id === order._id)
            ? prev
            : [order, ...prev]
        );
      }
    });

   socket.on("orderUpdate", (updated: Order) => {
  // remove from live
  setLiveOrders((prev) =>
    prev.filter((o) => o._id !== updated._id)
  );

  setOrders((prev) => {
    const currentTab = activeTabRef.current;

    // 🔥 UNPAID → PAID → REMOVE
    if (
      currentTab === "unpaid" &&
      updated.paymentStatus === "paid"
    ) {
      return prev.filter((o) => o._id !== updated._id);
    }

    // 🔥 PAID tab → ADD / UPDATE
    if (
      currentTab === "paid" &&
      updated.paymentStatus === "paid"
    ) {
      const exists = prev.find(
        (o) => o._id === updated._id
      );
      return exists
        ? prev.map((o) =>
            o._id === updated._id ? updated : o
          )
        : [updated, ...prev];
    }

    // 🔥 HISTORY → ALWAYS UPDATE
    if (currentTab === "history") {
      const exists = prev.find(
        (o) => o._id === updated._id
      );
      return exists
        ? prev.map((o) =>
            o._id === updated._id ? updated : o
          )
        : [updated, ...prev];
    }

    return prev;
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

  /* ================= SERVER-SIDE PAGINATION ================= */
  useEffect(() => {
    if (activeTab === "live") return;

    const tab = activeTab as PaginatedTab;
    const endpoint = endpointMap[tab];

    setLoading(true);

    fetch(`${BACKEND_URL}${endpoint}?page=${page}&limit=${LIMIT}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;

        setOrders(data.orders);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [activeTab, page]);

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
              onClick={() => {
                setActiveTab(tab.id as Tab);
                setPage(1);
              }}
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

          {activeTab === "paid" &&
            (loading ? (
              <p>Loading paid bills…</p>
            ) : (
              <PaidBills bills={orders} />
            ))}

          {activeTab === "unpaid" &&
            (loading ? (
              <p>Loading unpaid bills…</p>
            ) : (
              <UnpaidBills
                orders={orders}
                onMarkAsPaid={handleMarkAsPaid}
              />
            ))}

          {activeTab === "history" && (
            <motion.div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary">
                🧾 All Orders History
              </h2>

              {loading && <p>Loading…</p>}

              {!loading &&
                orders.map((order) => (
                  <div
                    key={order._id}
                    className="border rounded-2xl p-5 bg-card"
                  >
                    <p className="font-semibold">{order.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      📞 {order.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📅 {new Date(order.createdAt).toLocaleString()}
                    </p>

                    <div className="flex justify-between mt-3">
                      <p>
                        Payment:{" "}
                        <span
                          className={`font-semibold ${
                            order.paymentStatus === "paid"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </p>
                      <p className="font-bold">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {activeTab !== "live" && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-4 py-2">
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
