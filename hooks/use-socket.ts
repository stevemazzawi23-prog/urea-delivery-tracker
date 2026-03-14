/**
 * useSocket - Real-time synchronisation hook using Socket.io
 *
 * This hook connects to the VPS Socket.io server and listens for
 * data change events (deliveries, clients, invoices).
 * When an event is received, the provided callback is called so the
 * screen can refresh its data automatically.
 *
 * Usage:
 *   useSocket(userId, {
 *     onDeliveriesUpdated: () => refetchDeliveries(),
 *     onClientsUpdated:    () => refetchClients(),
 *     onInvoicesUpdated:   () => refetchInvoices(),
 *   });
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

// Lazily import socket.io-client only when needed (avoids bundling issues)
type SocketType = {
  connected: boolean;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
};

interface UseSocketOptions {
  onDeliveriesUpdated?: (data?: unknown) => void;
  onClientsUpdated?: (data?: unknown) => void;
  onSitesUpdated?: (data?: unknown) => void;
  onInvoicesUpdated?: (data?: unknown) => void;
}

export function useSocket(userId: string | null | undefined, options: UseSocketOptions = {}) {
  const socketRef = useRef<SocketType | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!userId) return;

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      console.warn("[Socket.io] No API base URL configured, skipping WebSocket connection");
      return;
    }

    let socket: SocketType | null = null;

    const connect = async () => {
      try {
        // Dynamic import to avoid SSR / bundling issues
        const { io } = await import("socket.io-client");

        socket = io(apiBase, {
          path: "/socket.io",
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          timeout: 10000,
        }) as unknown as SocketType;

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("[Socket.io] Connected to VPS");
          // All devices join the shared company room (user:1) to share data
          // This ensures admin and all drivers see the same real-time updates
          socket!.emit("join", "1");
        });

        socket.on("deliveries:updated", (data: unknown) => {
          console.log("[Socket.io] deliveries:updated", data);
          optionsRef.current.onDeliveriesUpdated?.(data);
        });

        socket.on("clients:updated", (data: unknown) => {
          console.log("[Socket.io] clients:updated", data);
          optionsRef.current.onClientsUpdated?.(data);
        });

        socket.on("sites:updated", (data: unknown) => {
          console.log("[Socket.io] sites:updated", data);
          optionsRef.current.onSitesUpdated?.(data);
        });

        socket.on("invoices:updated", (data: unknown) => {
          console.log("[Socket.io] invoices:updated", data);
          optionsRef.current.onInvoicesUpdated?.(data);
        });

        socket.on("disconnect", (reason: string) => {
          console.warn("[Socket.io] Disconnected:", reason);
        });

        socket.on("connect_error", (err: Error) => {
          console.warn("[Socket.io] Connection error:", err.message);
        });
      } catch (err) {
        console.warn("[Socket.io] Failed to initialize:", err);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("[Socket.io] Disconnected on cleanup");
      }
    };
  }, [userId]);

  return socketRef;
}
