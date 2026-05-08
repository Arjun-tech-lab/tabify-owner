import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Order {
  _id: string;
  userName: string;
  phone: string;
  items: any[];
  totalAmount: number;
  status: "requested" | "accepted" | "completed";
  paymentStatus: "paid" | "unpaid";
  createdAt: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export function useOrdersSocket(activeTab: string) {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [hasNewLive, setHasNewLive] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("registerRole", "owner");
    });

    socket.on("newOrder", (order: Order) => {
      if (order.status === "requested") {
        setLiveOrders((prev) => (prev.find((o) => o._id === order._id) ? prev : [order, ...prev]));
        if (activeTab !== "live") {
          setHasNewLive(true);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeTab]);

  const handleAcceptOrder = (id: string) => {
    socketRef.current?.emit("acceptOrder", id);
  };

  const handleDeclineOrder = (id: string) => {
    setLiveOrders((prev) => prev.filter((o) => o._id !== id));
  };

  return {
    liveOrders,
    hasNewLive,
    setHasNewLive,
    handleAcceptOrder,
    handleDeclineOrder,
    socketRef,
  };
}
