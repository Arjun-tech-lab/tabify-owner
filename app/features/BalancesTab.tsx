import { useEffect, useState } from "react";
import { fetchBalances } from "../services/balances.api";
import { useRouter } from "next/navigation";

export default function BalancesTab({ limit = 10 }: { limit?: number }) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetchBalances(page, limit, search)
      .then((data) => {
        if (!data?.success) return;
        setBalances(data.balances);
        setTotalPages(data.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, limit, search]);

  return (
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

      {loading ? (
        <p>Loading...</p>
      ) : balances.length === 0 ? (
        <p>No matching customers</p>
      ) : (
        balances.map((b: any) => (
          <div
            key={b._id}
            onClick={() => router.push(`/owner/ledger/${b._id}`)}
            className="border rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold">{b.userName}</p>
              <p className="text-sm text-muted-foreground">📞 {b.phone}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className={`text-xl font-bold ${b.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{b.totalDue}
              </p>
            </div>
          </div>
        ))
      )}

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
