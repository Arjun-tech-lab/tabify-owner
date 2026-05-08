import { useEffect, useState } from "react";
import { fetchOrders } from "../services/orders.api";

interface Order {
  _id: string;
  userName: string;
  phone: string;
  totalAmount: number;
  paymentStatus: "paid" | "unpaid";
  createdAt: string;
}

export default function HistoryTab({ limit = 10 }: { limit?: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchOrders("/api/orders/all", page, limit)
      .then((data) => {
        if (!data?.success) return;
        setOrders(data.orders);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, limit]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">🧾 All Orders History</h2>

      {loading && <p>Loading…</p>}

      {!loading &&
        orders.map((order) => (
          <div key={order._id} className="border rounded-2xl p-5 bg-card">
            <p className="font-semibold">{order.userName}</p>
            <p className="text-sm text-muted-foreground">📞 {order.phone}</p>
            <p className="text-xs text-muted-foreground">
              📅 {new Date(order.createdAt).toLocaleString()}
            </p>

            <div className="flex justify-between mt-3">
              <p>
                Payment:{" "}
                <span
                  className={`font-semibold ${
                    order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </p>
              <p className="font-bold">₹{order.totalAmount}</p>
            </div>
          </div>
        ))}

      {/* Pagination */}
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
    </div>
  );
}
