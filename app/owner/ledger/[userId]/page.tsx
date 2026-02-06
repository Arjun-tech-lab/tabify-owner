"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

/* ================= TYPES ================= */
interface LedgerEntry {
  type: "order" | "payment";
  amount: number;
  date: string;
  balanceAfter:number;
}

interface Customer {
  name: string;
  phone: string;
}

export default function LedgerPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH LEDGER ================= */
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    fetch(`${BACKEND_URL}/api/orders/ledger/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;

        setLedger(data.ledger);
        setBalance(data.balance);
        setCustomer(data.customer);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-primary font-medium mb-4"
      >
        ← Back
      </button>

      {/* Customer Info */}
      {customer && (
        <div className="mb-6">
          <h1 className="text-xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            📞 {customer.phone}
          </p>
        </div>
      )}

      {/* Balance */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-muted-foreground">
          Outstanding balance
        </span>
        <span
          className={`text-2xl font-bold ${
            balance > 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          ₹{balance}
        </span>
      </div>

     {/* Ledger Table */}
{loading ? (
  <p className="text-sm text-muted-foreground">
    Loading transactions…
  </p>
) : ledger.length === 0 ? (
  <p className="text-sm text-muted-foreground">
    No transactions found.
  </p>
) : (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b bg-muted/40">
          <th className="py-2 px-2 text-left font-medium">Date</th>
          <th className="py-2 px-2 text-left font-medium">Time</th>
          <th className="py-2 px-2 text-right font-medium text-red-600">
            Credit
          </th>
          <th className="py-2 px-2 text-right font-medium text-green-600">
            Paid
          </th>
          <th className="py-2 px-2 text-right font-medium">
            Balance
          </th>
        </tr>
      </thead>

      <tbody>
        {ledger.map((entry, idx) => {
          const dateObj = new Date(entry.date);

          return (
            <tr key={idx} className="border-b last:border-none">
              {/* DATE */}
              <td className="py-2 px-2">
                {dateObj.toLocaleDateString()}
              </td>

              {/* TIME */}
              <td className="py-2 px-2 text-muted-foreground">
                {dateObj.toLocaleTimeString()}
              </td>

              {/* CREDIT (ORDER) */}
              <td className="py-2 px-2 text-right text-red-600">
                {entry.amount > 0 ? `₹${entry.amount}` : "—"}
              </td>

              {/* PAID (PAYMENT) */}
              <td className="py-2 px-2 text-right text-green-600">
                {entry.amount < 0
                  ? `₹${Math.abs(entry.amount)}`
                  : "—"}
              </td>

              {/* RUNNING BALANCE */}
              <td className="py-2 px-2 text-right font-semibold">
                ₹{entry.balanceAfter}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}

      
    </div>
  );
}
