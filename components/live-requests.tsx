"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userName: string;
  items?: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

interface LiveRequestsProps {
  orders: any[]; // IMPORTANT: real data is mixed
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export default function LiveRequests({
  orders,
  onAccept,
  onDecline,
}: LiveRequestsProps) {
  // ✅ HARD FILTER – THIS IS THE FIX
  const safeOrders: Order[] = Array.isArray(orders)
    ? orders.filter(
        (o) =>
          o &&
          typeof o === "object" &&
          typeof o._id === "string"
      )
    : [];

  if (safeOrders.length === 0) {
    return (
      <Card className="p-8 text-center bg-muted">
        <p className="text-muted-foreground text-lg">
          No live orders at the moment
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {safeOrders.map((order) => (
        <Card
          key={order._id}
          className="p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {order.userName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                📅 {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                ₹{order.totalAmount}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Items:
            </p>
            <ul className="space-y-1">
              {Array.isArray(order.items) ? (
                order.items.map((item, idx) => (
                  <li key={idx} className="text-foreground">
                    • {item.name} × {item.quantity} — ₹
                    {item.price * item.quantity}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No items available
                </li>
              )}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              className="flex-1"
              onClick={() => onAccept(order._id)}
            >
              ✅ Accept
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onDecline(order._id)}
            >
              ❌ Decline
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
