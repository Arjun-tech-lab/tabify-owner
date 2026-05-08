const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export const fetchOrders = async (endpoint: string, page: number, limit: number, date?: string) => {
  let url = `${BACKEND_URL}${endpoint}?page=${page}&limit=${limit}`;
  if (date) {
    url += `&date=${encodeURIComponent(date)}`;
  }
  const res = await fetch(url);
  return res.json();
};
