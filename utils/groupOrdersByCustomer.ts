export const groupOrdersByCustomer = (orders: any[]) => {
  const map: Record<string, any[]> = {};

  orders.forEach((order) => {
    if (!map[order.phone]) {
      map[order.phone] = [];
    }
    map[order.phone].push(order);
  });

  return map;
};
