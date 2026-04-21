/**
 * API Client for SP Logistix VPS Backend
 * 
 * This module provides a simple REST client to call the tRPC endpoints
 * on the VPS at api.sp-logistix.com using JWT Bearer token authentication.
 * 
 * The tRPC endpoints use superjson transformer, so we need to handle
 * the serialization format properly.
 */

import { getApiBaseUrl } from "@/constants/oauth";
import { getAuthToken } from "./auth-context";

// ============================================================
// Helper: Make authenticated tRPC call
// ============================================================
async function trpcQuery<T>(
  procedure: string,
  input?: unknown
): Promise<T> {
  const apiBase = getApiBaseUrl();
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  // Build URL with input for GET queries
  let url = `${apiBase}/api/trpc/${procedure}`;
  if (input !== undefined) {
    const inputJson = JSON.stringify({ json: input });
    url += `?input=${encodeURIComponent(inputJson)}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // tRPC response format: { result: { data: { json: ... } } }
  if (data?.result?.data?.json !== undefined) {
    return data.result.data.json as T;
  }
  
  // Fallback: direct data
  if (data?.result?.data !== undefined) {
    return data.result.data as T;
  }

  throw new Error("Unexpected API response format");
}

async function trpcMutation<T>(
  procedure: string,
  input: unknown
): Promise<T> {
  const apiBase = getApiBaseUrl();
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = `${apiBase}/api/trpc/${procedure}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ json: input }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // tRPC response format: { result: { data: { json: ... } } }
  if (data?.result?.data?.json !== undefined) {
    return data.result.data.json as T;
  }
  
  if (data?.result?.data !== undefined) {
    return data.result.data as T;
  }

  throw new Error("Unexpected API response format");
}

// ============================================================
// Client API
// ============================================================

export interface ApiClient {
  id: number;
  userId: number;
  name: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiListClients(): Promise<ApiClient[]> {
  return trpcQuery<ApiClient[]>("delivery.listClients");
}

export async function apiCreateClient(data: {
  name: string;
  company?: string;
  phone?: string;
  address?: string;
  email?: string;
  notes?: string;
}): Promise<number> {
  return trpcMutation<number>("delivery.createClient", data);
}

export async function apiUpdateClient(clientId: number, data: {
  name?: string;
  company?: string;
  phone?: string;
  address?: string;
  email?: string;
  notes?: string;
}): Promise<void> {
  await trpcMutation("delivery.updateClient", { clientId, ...data });
}

export async function apiDeleteClient(clientId: number): Promise<void> {
  await trpcMutation("delivery.deleteClient", { clientId });
}

// ============================================================
// Site API
// ============================================================

export interface ApiSite {
  id: number;
  clientId: number;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiListSites(clientId: number): Promise<ApiSite[]> {
  return trpcQuery<ApiSite[]>("delivery.listSites", { clientId });
}

export async function apiCreateSite(data: {
  clientId: number;
  name: string;
  address?: string;
}): Promise<number> {
  return trpcMutation<number>("delivery.createSite", data);
}

export async function apiUpdateSite(siteId: number, data: {
  name?: string;
  address?: string;
}): Promise<void> {
  await trpcMutation("delivery.updateSite", { siteId, ...data });
}

export async function apiDeleteSite(siteId: number): Promise<void> {
  await trpcMutation("delivery.deleteSite", { siteId });
}

// ============================================================
// Delivery API
// ============================================================

export interface ApiDelivery {
  id: number;
  userId: number;
  clientId: number;
  clientName: string;
  clientCompany: string | null;
  siteId: number | null;
  siteName: string | null;
  driverName: string | null;
  startTime: string;
  endTime: string | null;
  litersDelivered: number;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export async function apiListDeliveries(): Promise<ApiDelivery[]> {
  return trpcQuery<ApiDelivery[]>("delivery.listDeliveries");
}

export async function apiCreateDelivery(data: {
  clientId: number;
  clientName: string;
  clientCompany?: string;
  siteId?: number;
  siteName?: string;
  driverName?: string;
  startTime: Date;
}): Promise<number> {
  return trpcMutation<number>("delivery.createDelivery", data);
}

export async function apiUpdateDelivery(deliveryId: number, data: {
  endTime?: Date;
  litersDelivered?: number;
  driverName?: string;
  photos?: string[];
}): Promise<void> {
  await trpcMutation("delivery.updateDelivery", { deliveryId, ...data });
}

export async function apiDeleteDelivery(deliveryId: number): Promise<void> {
  await trpcMutation("delivery.deleteDelivery", { deliveryId });
}

// ============================================================
// Invoice API
// ============================================================

export interface ApiInvoice {
  id: number;
  userId: number;
  deliveryId: number;
  clientId: number;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  serviceFee: number;
  pricePerLiter: number;
  litersDelivered: number;
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
  status: "draft" | "sent" | "paid";
  createdAt: string;
  updatedAt: string;
}

export async function apiListInvoices(): Promise<ApiInvoice[]> {
  return trpcQuery<ApiInvoice[]>("invoices.listInvoices");
}

export async function apiCreateInvoice(data: {
  deliveryId: number;
  clientId: number;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  serviceFee: number;
  pricePerLiter: number;
  litersDelivered: number;
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
  status?: "draft" | "sent" | "paid";
}): Promise<number> {
  return trpcMutation<number>("invoices.createInvoice", data);
}

export async function apiUpdateInvoiceStatus(invoiceId: number, status: "draft" | "sent" | "paid"): Promise<void> {
  await trpcMutation("invoices.updateStatus", { invoiceId, status });
}

export async function apiDeleteInvoice(invoiceId: number): Promise<void> {
  await trpcMutation("invoices.deleteInvoice", { invoiceId });
}

// ============================================================
// Equipment API
// ============================================================

export interface ApiEquipment {
  id: number;
  userId: number;
  name: string;
  capacity?: number;
  createdAt: string;
}

export async function apiListEquipment(): Promise<ApiEquipment[]> {
  return trpcQuery<ApiEquipment[]>("equipment.listEquipment");
}

export async function apiCreateEquipment(data: {
  name: string;
  capacity?: number;
}): Promise<ApiEquipment> {
  return trpcMutation<ApiEquipment>("equipment.createEquipment", data);
}

export async function apiDeleteEquipment(equipmentId: number): Promise<void> {
  await trpcMutation("equipment.deleteEquipment", { equipmentId });
}

export async function apiGetClientEquipment(clientId: number): Promise<ApiEquipment[]> {
  return trpcQuery<ApiEquipment[]>("equipment.getClientEquipment", { clientId });
}

export async function apiSetClientEquipment(clientId: number, equipmentIds: number[]): Promise<void> {
  await trpcMutation("equipment.setClientEquipment", { clientId, equipmentIds });
}

// ============================================================
// Check if API is available
// ============================================================
export async function isApiAvailable(): Promise<boolean> {
  try {
    const apiBase = getApiBaseUrl();
    if (!apiBase) return false;
    
    const response = await fetch(`${apiBase}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
