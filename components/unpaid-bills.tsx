"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Order {
  id: string
  customer: string
  items: string[]
  amount: number
  status: string
  time: string
}

interface UnpaidBillsProps {
  orders: Order[]
  onMarkAsPaid: (id: string) => void // ✅ changed from number → string
}

export default function UnpaidBills({ orders, onMarkAsPaid }: UnpaidBillsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: 100 },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
      {orders.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-to-br from-muted to-muted/50">
          <p className="text-muted-foreground text-lg">No unpaid bills</p>
        </Card>
      ) : (
        orders.map((order) => (
          <motion.div key={order.id} variants={itemVariants} exit="exit">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-destructive/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{order.customer}</h3>
                  <p className="text-sm text-muted-foreground mt-1">📅 {order.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-destructive">₹{order.amount}</p>
                  <p className="text-xs text-destructive font-semibold mt-1">DUE</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Items:</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-foreground">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => onMarkAsPaid(order.id)} // ✅ order.id is string now
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                ✅ Mark as Paid
              </Button>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  )
}
