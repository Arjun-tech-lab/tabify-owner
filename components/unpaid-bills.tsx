"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

/* ✅ Backend Order shape */
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

interface UnpaidBillsProps {
  orders: Order[];
}

export default function UnpaidBills({ orders }: UnpaidBillsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: 100 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {orders.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-to-br from-muted to-muted/50">
          <p className="text-muted-foreground text-lg">
            No unpaid bills
          </p>
        </Card>
      ) : (
        orders.map((order) => (
          <motion.div
            key={order._id}
            variants={itemVariants}
            exit="exit"
          >
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-destructive/20">
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
                  <p className="text-3xl font-bold text-destructive">
                    ₹{order.totalAmount}
                  </p>
                  <p className="text-xs text-destructive font-semibold mt-1">
                    DUE
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">
                  Items:
                </p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-foreground">
                      • {item.name} × {item.quantity} — ₹
                      {item.price * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
