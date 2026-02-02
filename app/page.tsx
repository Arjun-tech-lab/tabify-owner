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

type Tab = "live" | "paid" | "unpaid" | "history" | "balance";
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
  const [search, setSearch] = useState("");
  const [confirmUser, setConfirmUser] = useState<null | {
  id: string;
  name: string;
  amount: number;
}>(null);



  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef<Tab>(activeTab);
  const [balances, setBalances] = useState([]);


  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
  if (activeTab !== "balance") return;

  setLoading(true);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
    search
  });

  fetch(`${BACKEND_URL}/api/orders/balances?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (!data?.success) return;

      setBalances(data.balances);
      setTotalPages(data.pagination.totalPages);
    })
    .finally(() => setLoading(false));
}, [activeTab, page, search]);



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
  
  const handleMarkBalanceAsPaid = async (userId: string) => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/orders/balances/mark-paid`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );

    const data = await res.json();
    if (!data.success) return;

    // ✅ remove customer from balances
    setBalances((prev: any[]) =>
      prev.filter((b) => b._id !== userId)
    );
  } catch (err) {
    console.error("Mark balance paid failed", err);
  }
};


  /* ================= SERVER-SIDE PAGINATION ================= */
  useEffect(() => {
  if (
    activeTab === "live" ||
    activeTab === "balance"
  ) {
    return;
  }

  const endpoint = endpointMap[activeTab as PaginatedTab];
  if (!endpoint) return;

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
            {id: "balance",label: "Balance" },
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
          <AnimatePresence>
  {confirmUser && (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h3 className="text-lg font-semibold mb-2">
          Confirm payment
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          Mark <strong>{confirmUser.name}</strong>’s outstanding balance as
          paid?
        </p>

        <div className="flex justify-between items-center mb-6">
          <span className="text-sm">Amount due</span>
          <span className="text-lg font-bold text-red-600">
            ₹{confirmUser.amount}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setConfirmUser(null)}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              handleMarkBalanceAsPaid(confirmUser.id);
              setConfirmUser(null);
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


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
          {activeTab === "balance" && (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">💰 Customer Balances</h2>

    {/* 🔍 Search */}
    <input
      type="text"
      placeholder="Search by customer name..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1); // reset pagination on search
      }}
      className="w-full max-w-md px-4 py-2 border rounded-lg"
    />

    {balances.length === 0 ? (
  <p>No matching customers</p>
) : (
  balances.map((b: any) => (
    <div
      key={b._id}
      className="border rounded-xl p-4 flex justify-between items-center"
    >
      {/* LEFT: Customer info */}
      <div>
        <p className="font-semibold">{b.userName}</p>
        <p className="text-sm text-muted-foreground">
          📞 {b.phone}
        </p>
      </div>

      {/* RIGHT: Amount + action */}
      <div className="flex items-center gap-4">
        <p className="text-xl font-bold text-red-600">
          ₹{b.totalDue}
        </p>

       <button
  onClick={() =>
    setConfirmUser({
      id: b._id,
      name: b.userName,
      amount: b.totalDue,
    })
  }
  className="px-3 py-1.5 text-sm font-medium
             bg-green-600 text-white rounded-md
             hover:bg-green-700 transition"
>
  ✓ Paid
</button>


      </div>
    </div>
  ))
)}

  </div>
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
