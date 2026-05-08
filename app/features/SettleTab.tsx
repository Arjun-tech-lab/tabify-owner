import { useEffect, useState } from "react";
import { fetchBalances } from "../services/balances.api";
import { settleBalance } from "../services/settle.api";
import { motion, AnimatePresence } from "framer-motion";

export default function SettleTab({ limit = 10 }: { limit?: number }) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [settleUser, setSettleUser] = useState<null | { id: string; name: string; maxAmount: number }>(null);
  const [settleAmountInput, setSettleAmountInput] = useState("");
  const [recentSettlements, setRecentSettlements] = useState<Record<string, { amount: number; remaining: number }>>({});

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

  const handlePartialSettle = async (userId: string, amount: number) => {
    try {
      const data = await settleBalance(userId, amount);
      if (!data?.success) return;

      const settled = data.amountSettled;
      const remaining = data.newBalance;

      setBalances((prev: any[]) =>
        prev.map((b) => (b._id === userId ? { ...b, totalDue: remaining } : b))
      );

      setRecentSettlements((prev) => ({
        ...prev,
        [userId]: { amount: settled, remaining },
      }));
    } catch (err) {
      console.error("Partial settle failed", err);
    }
  };

  return (
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

      {loading ? (
        <p>Loading...</p>
      ) : balances.length === 0 ? (
        <p>No matching customers</p>
      ) : (
        balances.map((b: any) => (
          <div key={b._id} className="border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{b.userName}</p>
              <p className="text-sm text-muted-foreground">📞 {b.phone}</p>
              {recentSettlements[b._id] && (
                <p className="text-xs text-green-700 mt-1">
                  Settled ₹{recentSettlements[b._id].amount} · Remaining ₹{recentSettlements[b._id].remaining}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <p className={`text-xl font-bold ${b.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{b.totalDue}
              </p>

              <button
                onClick={() => {
                  setSettleUser({ id: b._id, name: b.userName, maxAmount: b.totalDue });
                  setSettleAmountInput(String(b.totalDue));
                }}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Settle
              </button>
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
              <h3 className="text-lg font-semibold mb-2">Settle balance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter amount to settle for <strong>{settleUser.name}</strong>.
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
                    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
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
