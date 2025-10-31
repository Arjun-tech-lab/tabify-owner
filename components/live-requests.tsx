"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Order {
  id: string
  user: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: string
  timestamp: string
}

interface LiveRequestsProps {
  orders: Order[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}

export default function LiveRequests({ orders, onAccept, onDecline }: LiveRequestsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
          <p className="text-muted-foreground text-lg">No live orders at the moment</p>
        </Card>
      ) : (
        orders.map((order) => (
          <motion.div key={order.id} variants={itemVariants} exit="exit">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{order.user}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    📅 {new Date(order.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">₹{order.total}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Items:</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-foreground">
                      • {item.name} × {item.quantity} — ₹{item.price * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => onAccept(order.id)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  ✅ Accept
                </Button>
                <Button
                  onClick={() => onDecline(order.id)}
                  variant="outline"
                  className="flex-1"
                >
                  ❌ Decline
                </Button>
              </div>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  )
}
