const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export const fetchLedger = async (userId: string) => {
  const res = await fetch(`${BACKEND_URL}/api/orders/ledger/${userId}`);
  return res.json();
};
