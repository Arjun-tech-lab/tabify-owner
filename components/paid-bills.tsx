"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface Bill {
  id: number
  customer: string
  items: string[]
  amount: number
  status: string
  time: string
}

interface PaidBillsProps {
  bills: Bill[]
}

export default function PaidBills({ bills }: PaidBillsProps) {
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Summary Card */}
      {bills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <p className="text-sm font-semibold text-muted-foreground">Total Paid Bills Today</p>
            <p className="text-3xl font-bold text-primary mt-2">{bills.length}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <p className="text-sm font-semibold text-muted-foreground">Total Amount Collected</p>
            <p className="text-3xl font-bold text-accent mt-2">₹{totalAmount}</p>
          </Card>
        </div>
      )}

      {/* Bills List */}
      <div className="space-y-4">
        {bills.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-to-br from-muted to-muted/50">
            <p className="text-muted-foreground text-lg">No paid bills yet</p>
          </Card>
        ) : (
          bills.map((bill) => (
            <motion.div key={bill.id} variants={itemVariants}>
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{bill.customer}</h3>
                    <p className="text-sm text-muted-foreground mt-1">📅 {bill.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">₹{bill.amount}</p>
                    <p className="text-xs text-primary font-semibold mt-1">PAID ✓</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Items:</p>
                  <ul className="space-y-1">
                    {bill.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
