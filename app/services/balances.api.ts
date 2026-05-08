const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export const fetchBalances = async (page: number, limit: number, search: string) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search
  });

  const res = await fetch(`${BACKEND_URL}/api/orders/balances?${params.toString()}`);
  return res.json();
};
