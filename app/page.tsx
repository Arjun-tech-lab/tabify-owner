"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { io, Socket } from "socket.io-client"
import DashboardHeader from "@/components/dashboard-header"
import LiveRequests from "@/components/live-requests"
import PaidBills from "@/components/paid-bills"
import UnpaidBills from "@/components/unpaid-bills"

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<"live" | "paid" | "unpaid">("live")
  const [orders, setOrders] = useState<any[]>([])
  const [paidBills, setPaidBills] = useState<any[]>([])
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    // ✅ Create socket inside useEffect to avoid multiple connections
    const socket: Socket = io("http://localhost:5001", {
      transports: ["websocket"],
      withCredentials: true,
      reconnectionAttempts: 5,
    })

    // 🔌 When connected
    socket.on("connect", () => {
      console.log("✅ Owner connected to backend:", socket.id)
    })

    // 📨 When receiving a new order
    socket.on("newOrder", (order) => {
      console.log("📦 New order received:", order)
      setOrders((prev) => [...prev, order])
    })

    // ❌ When disconnected
    socket.on("disconnect", (reason) => {
      console.log("⚠️ Disconnected:", reason)
    })

    // ✅ Cleanup properly
    return () => {
      socket.off("connect")
      socket.off("newOrder")
      socket.off("disconnect")
      socket.close()
    }
  }, [])

  const handleAcceptOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id))
    setToast({ message: "✅ Order accepted!", type: "success" })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDeclineOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id))
    setToast({ message: "❌ Order declined", type: "error" })
    setTimeout(() => setToast(null), 3000)
  }

  const handleMarkAsPaid = (id: string) => {
    const order = orders.find((o) => o.id === id)
    if (order) {
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setPaidBills((prev) => [...prev, { ...order, status: "Paid" }])
      setToast({ message: "✅ Payment marked as received!", type: "success" })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const unpaidOrders = orders.filter((o) => o.status === "Pending")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Tabs */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: "live", label: "Live Requests" },
              { id: "paid", label: "Paid Bills" },
              { id: "unpaid", label: "Unpaid Bills" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-2 font-medium text-sm relative transition-colors ${
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "live" && (
            <LiveRequests
              key="live"
              orders={orders}
              onAccept={handleAcceptOrder}
              onDecline={handleDeclineOrder}
            />
          )}
          {activeTab === "paid" && <PaidBills key="paid" bills={paidBills} />}
          {activeTab === "unpaid" && (
            <UnpaidBills key="unpaid" orders={unpaidOrders} onMarkAsPaid={handleMarkAsPaid} />
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg font-medium shadow-lg ${
              toast.type === "success"
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
