const PORTAL_URL = "https://portail.sp-logistix.com";
const PORTAL_API_TOKEN = "78f1f915800411b61a7133928a67970339f05712764ae8824a06f013564e9af5";

export interface PortalSyncResult {
  success: boolean;
  message: string;
  ticketId?: number;
  error?: string;
}

export interface PortalDeliveryUnit {
  unitName: string;
  liters: number;
}

export async function syncDeliveryToPortal(params: {
  clientCode: string;
  ticketNumber: string;
  startTime: number;
  endTime: number;
  totalLiters: number;
  units: PortalDeliveryUnit[];
  driverName: string;
  siteName: string;
  locationCode?: string;
} ): Promise<PortalSyncResult> {
  try {
    const durationSeconds = Math.floor((params.endTime - params.startTime) / 1000);
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const duration = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const deliveryDate = new Date(params.startTime).toISOString().split("T")[0];
    const response = await fetch(`${PORTAL_URL}/api/import-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiToken: PORTAL_API_TOKEN,
        clientCode: params.clientCode,
        ticketNumber: params.ticketNumber,
        deliveryDate,
        volumeTotal: params.totalLiters,
        pieces: params.units.length,
        locationCode: params.locationCode || params.siteName || "",
        duration,
        startTime: params.startTime,
        endTime: params.endTime,
        driverName: params.driverName,
        siteName: params.siteName,
        units: params.units,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.error || "Erreur lors de la synchronisation" };
    }
    return { success: true, message: data.message || "Livraison synchronisée", ticketId: data.ticketId };
  } catch (error: any) {
    return { success: false, message: "Impossible de contacter le portail SP Logistix", error: error?.message };
  }
}

export function generateTicketNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const h = now.getHours().toString().padStart(2, "0");
  const min = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");
  return `APK-${y}${m}${d}-${h}${min}${s}`;
}
