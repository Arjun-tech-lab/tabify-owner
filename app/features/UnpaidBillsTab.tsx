import { useEffect, useState } from "react";
import { fetchOrders } from "../services/orders.api";
import UnpaidBills from "@/components/unpaid-bills";

export default function UnpaidBillsTab({ socket, limit = 10 }: { socket: any; limit?: number }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchOrders("/api/orders/unpaid", page, limit)
      .then((data) => {
        if (!data?.success) return;
        setOrders(data.orders);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated: any) => {
      if (updated.paymentStatus === "paid") {
        setOrders((prev) => prev.filter((o) => o._id !== updated._id));
      }
    };
    socket.on("orderUpdate", handleUpdate);
    return () => {
      socket.off("orderUpdate", handleUpdate);
    };
  }, [socket]);

  return (
    <div>
      {loading ? <p>Loading unpaid bills…</p> : <UnpaidBills orders={orders} />}
      <div className="flex justify-center gap-4 mt-6">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
        <span className="px-4 py-2">Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
