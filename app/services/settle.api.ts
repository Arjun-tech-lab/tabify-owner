const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export const settleBalance = async (userId: string, amount: number) => {
  const res = await fetch(`${BACKEND_URL}/api/orders/balances/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount }),
  });
  return res.json();
};
