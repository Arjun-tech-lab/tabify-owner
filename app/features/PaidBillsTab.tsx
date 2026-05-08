import { useEffect, useState } from "react";
import { fetchOrders } from "../services/orders.api";
import PaidBills from "@/components/paid-bills";

export default function PaidBillsTab({ socket, limit = 10 }: { socket: any; limit?: number }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidTotalForDate, setPaidTotalForDate] = useState(0);
  const [paidTotalAllTime, setPaidTotalAllTime] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchOrders("/api/orders/paid", page, limit, paidDate)
      .then((data) => {
        if (!data?.success) return;
        setOrders(data.orders);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setPaidTotalForDate(data.totals?.totalForDate ?? 0);
        setPaidTotalAllTime(data.totals?.totalAllTime ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, limit, paidDate]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated: any) => {
      if (updated.paymentStatus === "paid") {
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === updated._id);
          return exists ? prev.map((o) => (o._id === updated._id ? updated : o)) : [updated, ...prev];
        });
      }
    };
    socket.on("orderUpdate", handleUpdate);
    return () => {
      socket.off("orderUpdate", handleUpdate);
    };
  }, [socket]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select date</label>
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
          <p className="font-semibold">Collected on this day: ₹{paidTotalForDate}</p>
          <p className="text-muted-foreground">Total collected overall: ₹{paidTotalAllTime}</p>
        </div>
      </div>

      {loading ? <p>Loading paid bills…</p> : <PaidBills bills={orders} />}

      <div className="flex justify-center gap-4 mt-6">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
        <span className="px-4 py-2">Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
