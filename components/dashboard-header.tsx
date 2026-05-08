"use client"

import { useEffect, useState } from "react"

export default function DashboardHeader() {
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tabify  Owner </h1>
            <p className="text-muted-foreground mt-1">Manage live orders and track payments.</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary">{time}</div>
            <p className="text-muted-foreground text-sm mt-1">Current Time</p>
          </div>
        </div>
      </div>
    </div>
  )
}
