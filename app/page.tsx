"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import DashboardHeader from "@/components/dashboard-header";
import LiveRequests from "@/components/live-requests";
import PaidBills from "@/components/paid-bills";
import UnpaidBills from "@/components/unpaid-bills";
import { useRouter } from "next/navigation";


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

type Tab = "live" | "paid" | "unpaid" | "history" | "balance" | "settle";
type PaginatedTab = Exclude<Tab, "live">;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

const LIMIT = 10;

const endpointMap: Partial<Record<PaginatedTab, string>> = {
  history: "/api/orders/all",
  paid: "/api/orders/paid",
  unpaid: "/api/orders/unpaid",
};

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [search, setSearch] = useState("");
const [hasNewLive, setHasNewLive] = useState(false);

const [settleUser, setSettleUser] = useState<null | {
  id: string;
  name: string;
  maxAmount: number;
}>(null);
const [settleAmountInput, setSettleAmountInput] = useState("");
const [recentSettlements, setRecentSettlements] = useState<
  Record<string, { amount: number; remaining: number }>
>({});

const [ledgerUser, setLedgerUser] = useState<null | {
  id: string;
  name: string;
}>(null);
const router = useRouter();

const [ledger, setLedger] = useState<any[]>([]);
const [ledgerBalance, setLedgerBalance] = useState(0);
useEffect(() => {
  activeTabRef.current = activeTab;
}, [activeTab]);


useEffect(() => {
  if (!ledgerUser) return;

  fetch(`${BACKEND_URL}/api/orders/ledger/${ledgerUser.id}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) return;
      setLedger(data.ledger);
      setLedgerBalance(data.balance);
    });
}, [ledgerUser]);


  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef<Tab>(activeTab);
  const [balances, setBalances] = useState([]);


  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [paidDate, setPaidDate] = useState("");
  const [paidTotalForDate, setPaidTotalForDate] = useState(0);
  const [paidTotalAllTime, setPaidTotalAllTime] = useState(0);

  // When entering Paid tab for the first time, default to today's date
  useEffect(() => {
    if (activeTab === "paid" && !paidDate) {
      const today = new Date();
const localISO = new Date(
  today.getTime() - today.getTimezoneOffset() * 60000
)
  .toISOString()
  .slice(0, 10);

setPaidDate(localISO);
    
    }
  }, [activeTab, paidDate]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
  if (activeTab !== "balance" && activeTab !== "settle") return;

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
         if (activeTabRef.current !== "live") {
      setHasNewLive(true);
    }
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

  const handlePartialSettle = async (userId: string, amount: number) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orders/balances/settle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, amount }),
        }
      );

      const data = await res.json();
      if (!data?.success) return;

      const settled = data.amountSettled;
      const remaining = data.newBalance;

      setBalances((prev: any[]) =>
        prev.map((b) =>
          b._id === userId ? { ...b, totalDue: remaining } : b
        )
      );

      setRecentSettlements((prev) => ({
        ...prev,
        [userId]: {
          amount: settled,
          remaining,
        },
      }));
    } catch (err) {
      console.error("Partial settle failed", err);
    }
  };

  /* ================= SERVER-SIDE PAGINATION ================= */
  useEffect(() => {
  if (
    activeTab === "live" ||
    activeTab === "balance" ||
    activeTab === "settle"
  ) {
    return;
  }

  const endpoint = endpointMap[activeTab as PaginatedTab];
  if (!endpoint) return;

  setLoading(true);

  let url = `${BACKEND_URL}${endpoint}?page=${page}&limit=${LIMIT}`;

  if (activeTab === "paid" && paidDate) {
    url += `&date=${encodeURIComponent(paidDate)}`;
  }

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data?.success) return;

      setOrders(data.orders);
      setTotalPages(data.pagination?.totalPages ?? 1);

      if (activeTab === "paid") {
        setPaidTotalForDate(data.totals?.totalForDate ?? 0);
        setPaidTotalAllTime(data.totals?.totalAllTime ?? 0);
      }
    })
    .finally(() => setLoading(false));
}, [activeTab, page, paidDate]);


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
      { id: "balance", label: "Balance" },
      { id: "settle", label: "Settle" },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => {
          setActiveTab(tab.id as Tab);
          setPage(1);

          // 🔴 clear red dot when Live tab is opened
          if (tab.id === "live") {
            setHasNewLive(false);
          }
        }}
        className="py-4 relative font-medium"
      >
        {/* Label + Red Dot */}
        <span className="relative inline-flex items-center">
          {tab.label}

          {/* 🔴 Red dot indicator */}
          {tab.id === "live" && hasNewLive && activeTab !== "live" && (
            <span className="absolute -top-1 -right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
        </span>

        {/* Active underline */}
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
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select date
                </label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => {
                    setPaidDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="text-sm md:text-right space-y-1">
                <p className="font-semibold">
                  Collected on this day: ₹{paidTotalForDate}
                </p>
                <p className="text-muted-foreground">
                  Total collected overall: ₹{paidTotalAllTime}
                </p>
              </div>
            </div>

            {loading ? (
              <p>Loading paid bills…</p>
            ) : (
              <PaidBills bills={orders} />
            )}
          </div>
        )}

        {activeTab === "unpaid" &&
          (loading ? (
            <p>Loading unpaid bills…</p>
          ) : (
            <UnpaidBills orders={orders} />
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
                    <p className="font-bold">₹{order.totalAmount}</p>
                  </div>
                </div>
              ))}
          </motion.div>
        )}

        {activeTab === "balance" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">💰 Customer Balances</h2>

            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full max-w-md px-4 py-2 border rounded-lg"
            />

            {balances.length === 0 ? (
              <p>No matching customers</p>
            ) : (
              balances.map((b: any) => (
                <div
                  key={b._id}
                  onClick={() => router.push(`/owner/ledger/${b._id}`)}
                  className="border rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{b.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      📞 {b.phone}
                    </p>
                    {recentSettlements[b._id] && (
                      <p className="text-xs text-green-700 mt-1">
                        Settled ₹{recentSettlements[b._id].amount} · Remaining ₹
                        {recentSettlements[b._id].remaining}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-red-600">
                      ₹{b.totalDue}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "settle" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">🧾 Settle Balances</h2>

            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
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
                  <div>
                    <p className="font-semibold">{b.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      📞 {b.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-red-600">
                      ₹{b.totalDue}
                    </p>

                    <button
                      onClick={() => {
                        setSettleUser({
                          id: b._id,
                          name: b.userName,
                          maxAmount: b.totalDue,
                        });
                        setSettleAmountInput(String(b.totalDue));
                      }}
                      className="px-3 py-1.5 text-sm font-medium
                                 bg-blue-600 text-white rounded-md
                                 hover:bg-blue-700 transition"
                    >
                      Settle
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

    {/* ✅ PARTIAL SETTLEMENT MODAL */}
    <AnimatePresence>
      {settleUser && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
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
              Settle balance
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              Enter amount to settle for{" "}
              <strong>{settleUser.name}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">
                Amount (max ₹{settleUser.maxAmount})
              </label>
              <input
                type="number"
                min={0}
                max={settleUser.maxAmount}
                value={settleAmountInput}
                onChange={(e) => setSettleAmountInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSettleUser(null);
                  setSettleAmountInput("");
                }}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const numericAmount = Number(settleAmountInput);
                  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                    return;
                  }
                  handlePartialSettle(settleUser.id, numericAmount);
                  setSettleUser(null);
                  setSettleAmountInput("");
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

}
