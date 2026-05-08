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

interface PaidBillsProps {
  bills: Order[];
}

export default function PaidBills({ bills }: PaidBillsProps) {
  const totalAmount = bills.reduce(
    (sum, bill) => sum + bill.totalAmount,
    0
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Summary */}
      {bills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Total Paid Bills
            </p>
            <p className="text-3xl font-bold">{bills.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Total Amount Collected
            </p>
            <p className="text-3xl font-bold">
              ₹{totalAmount}
            </p>
          </Card>
        </div>
      )}

      {/* List */}
      {bills.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No paid bills yet
          </p>
        </Card>
      ) : (
        bills.map((order) => (
          <motion.div
            key={order._id}
            variants={itemVariants}
          >
            <Card className="p-6">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-bold">
                    {order.userName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    📅{" "}
                    {new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    ₹{order.totalAmount}
                  </p>
                  <p className="text-xs text-green-600">
                    PAID
                  </p>
                </div>
              </div>

              <ul className="text-sm space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    • {item.name} × {item.quantity} — ₹
                    {item.price * item.quantity}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
