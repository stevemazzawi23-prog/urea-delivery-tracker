/**
 * API Storage Layer for SP Logistix
 * 
 * This module provides the same interface as storage.ts but uses the VPS API
 * for data persistence, enabling multi-device synchronization.
 * 
 * When the API is available, data is stored on the VPS.
 * When offline, falls back to local AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Client,
  Site,
  Delivery,
  Invoice,
  getClients as localGetClients,
  saveClient as localSaveClient,
  updateClient as localUpdateClient,
  deleteClient as localDeleteClient,
  getSites as localGetSites,
  saveSite as localSaveSite,
  updateSite as localUpdateSite,
  deleteSite as localDeleteSite,
  getSitesByClient as localGetSitesByClient,
  getDeliveries as localGetDeliveries,
  saveDelivery as localSaveDelivery,
  updateDelivery as localUpdateDelivery,
  deleteDelivery as localDeleteDelivery,
  getDeliveriesByClient as localGetDeliveriesByClient,
  getInvoices as localGetInvoices,
  saveInvoice as localSaveInvoice,
  updateInvoiceStatus as localUpdateInvoiceStatus,
  deleteInvoice as localDeleteInvoice,
  getInvoicesByDelivery as localGetInvoicesByDelivery,
} from "./storage";

import {
  apiListClients,
  apiCreateClient,
  apiUpdateClient,
  apiDeleteClient,
  apiListSites,
  apiCreateSite,
  apiUpdateSite,
  apiDeleteSite,
  apiListDeliveries,
  apiCreateDelivery,
  apiUpdateDelivery,
  apiDeleteDelivery,
  apiListInvoices,
  apiCreateInvoice,
  apiUpdateInvoiceStatus,
  apiDeleteInvoice,
  isApiAvailable,
  ApiClient,
  ApiSite,
  ApiDelivery,
  ApiInvoice,
} from "./api-client";

import { getAuthToken } from "./auth-context";

// ============================================================
// ID Mapping: API numeric IDs <-> Local string IDs
// We store a mapping so that local IDs can be resolved to API IDs
// ============================================================

const CLIENT_ID_MAP_KEY = "@urea_client_id_map";
const SITE_ID_MAP_KEY = "@urea_site_id_map";
const DELIVERY_ID_MAP_KEY = "@urea_delivery_id_map";
const INVOICE_ID_MAP_KEY = "@urea_invoice_id_map";

type IdMap = Record<string, number>; // localId -> apiId

async function getIdMap(key: string): Promise<IdMap> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

async function setIdMap(key: string, map: IdMap): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(map));
  } catch (error) {
    console.error("[ApiStorage] Failed to save ID map:", error);
  }
}

async function addIdMapping(mapKey: string, localId: string, apiId: number): Promise<void> {
  const map = await getIdMap(mapKey);
  map[localId] = apiId;
  await setIdMap(mapKey, map);
}

async function getApiId(mapKey: string, localId: string): Promise<number | null> {
  const map = await getIdMap(mapKey);
  return map[localId] ?? null;
}

// ============================================================
// Convert API types to local storage types
// ============================================================

function apiClientToLocal(apiClient: ApiClient): Client {
  return {
    id: String(apiClient.id),
    name: apiClient.name,
    company: apiClient.company ?? "",
    phone: apiClient.phone ?? "",
    address: apiClient.address ?? "",
    email: apiClient.email ?? undefined,
    notes: apiClient.notes ?? "",
    createdAt: new Date(apiClient.createdAt).getTime(),
  };
}

function apiSiteToLocal(apiSite: ApiSite): Site {
  return {
    id: String(apiSite.id),
    clientId: String(apiSite.clientId),
    name: apiSite.name,
    address: apiSite.address ?? "",
    createdAt: new Date(apiSite.createdAt).getTime(),
  };
}

function apiDeliveryToLocal(apiDelivery: ApiDelivery): Delivery {
  return {
    id: String(apiDelivery.id),
    clientId: String(apiDelivery.clientId),
    clientName: apiDelivery.clientName,
    clientCompany: apiDelivery.clientCompany ?? "",
    siteId: String(apiDelivery.siteId ?? ""),
    siteName: apiDelivery.siteName ?? "",
    driverName: apiDelivery.driverName ?? undefined,
    startTime: new Date(apiDelivery.startTime).getTime(),
    endTime: apiDelivery.endTime ? new Date(apiDelivery.endTime).getTime() : 0,
    units: [], // Units are stored in litersDelivered total
    litersDelivered: apiDelivery.litersDelivered,
    photos: apiDelivery.photos ?? [],
    createdAt: new Date(apiDelivery.createdAt).getTime(),
  };
}

function apiInvoiceToLocal(apiInvoice: ApiInvoice): Invoice {
  return {
    id: String(apiInvoice.id),
    deliveryId: String(apiInvoice.deliveryId),
    clientId: String(apiInvoice.clientId),
    clientName: apiInvoice.clientName,
    clientEmail: apiInvoice.clientEmail ?? undefined,
    clientAddress: apiInvoice.clientAddress ?? undefined,
    invoiceNumber: apiInvoice.invoiceNumber,
    invoiceDate: new Date(apiInvoice.invoiceDate).getTime(),
    serviceFee: apiInvoice.serviceFee,
    pricePerLiter: apiInvoice.pricePerLiter,
    litersDelivered: apiInvoice.litersDelivered,
    subtotal: apiInvoice.subtotal,
    gst: apiInvoice.gst,
    qst: apiInvoice.qst,
    total: apiInvoice.total,
    status: apiInvoice.status,
    createdAt: new Date(apiInvoice.createdAt).getTime(),
  };
}

// ============================================================
// Check if we should use API (token available + API reachable)
// ============================================================
async function shouldUseApi(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  return true; // Assume API is available if we have a token
}

// ============================================================
// CLIENT FUNCTIONS
// ============================================================

export async function getClients(): Promise<Client[]> {
  try {
    if (await shouldUseApi()) {
      const apiClients = await apiListClients();
      const localClients = apiClients.map(apiClientToLocal);
      
      // Cache locally for offline use
      const CLIENTS_KEY = "@urea_delivery_clients";
      await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(localClients));
      
      return localClients;
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for getClients, using local:", error);
  }
  
  return localGetClients();
}

export async function saveClient(client: Omit<Client, "id" | "createdAt">): Promise<Client> {
  try {
    if (await shouldUseApi()) {
      const apiId = await apiCreateClient({
        name: client.name,
        company: client.company || undefined,
        phone: client.phone || undefined,
        address: client.address || undefined,
        email: client.email || undefined,
        notes: client.notes || undefined,
      });
      
      const newClient: Client = {
        ...client,
        id: String(apiId),
        createdAt: Date.now(),
      };
      
      // Also save locally for offline access
      await localSaveClient(client).catch(() => {});
      
      return newClient;
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for saveClient, using local:", error);
  }
  
  return localSaveClient(client);
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(id);
      if (!isNaN(apiId)) {
        await apiUpdateClient(apiId, {
          name: updates.name,
          company: updates.company || undefined,
          phone: updates.phone || undefined,
          address: updates.address || undefined,
          email: updates.email || undefined,
          notes: updates.notes || undefined,
        });
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for updateClient, using local:", error);
  }
  
  return localUpdateClient(id, updates);
}

export async function deleteClient(id: string): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(id);
      if (!isNaN(apiId)) {
        await apiDeleteClient(apiId);
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for deleteClient, using local:", error);
  }
  
  return localDeleteClient(id);
}

// ============================================================
// SITE FUNCTIONS
// ============================================================

export async function getSites(): Promise<Site[]> {
  // Sites are loaded per-client, so this returns all local sites
  return localGetSites();
}

export async function saveSite(site: Omit<Site, "id" | "createdAt">): Promise<Site> {
  try {
    if (await shouldUseApi()) {
      const clientApiId = parseInt(site.clientId);
      if (!isNaN(clientApiId)) {
        const apiId = await apiCreateSite({
          clientId: clientApiId,
          name: site.name,
          address: site.address || undefined,
        });
        
        const newSite: Site = {
          ...site,
          id: String(apiId),
          createdAt: Date.now(),
        };
        
        return newSite;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for saveSite, using local:", error);
  }
  
  return localSaveSite(site);
}

export async function updateSite(id: string, updates: Partial<Site>): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(id);
      if (!isNaN(apiId)) {
        await apiUpdateSite(apiId, {
          name: updates.name,
          address: updates.address || undefined,
        });
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for updateSite, using local:", error);
  }
  
  return localUpdateSite(id, updates);
}

export async function deleteSite(id: string): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(id);
      if (!isNaN(apiId)) {
        await apiDeleteSite(apiId);
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for deleteSite, using local:", error);
  }
  
  return localDeleteSite(id);
}

export async function getSitesByClient(clientId: string): Promise<Site[]> {
  try {
    if (await shouldUseApi()) {
      const apiClientId = parseInt(clientId);
      if (!isNaN(apiClientId)) {
        const apiSites = await apiListSites(apiClientId);
        return apiSites.map(apiSiteToLocal);
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for getSitesByClient, using local:", error);
  }
  
  return localGetSitesByClient(clientId);
}

// ============================================================
// DELIVERY FUNCTIONS
// ============================================================

export async function getDeliveries(): Promise<Delivery[]> {
  try {
    if (await shouldUseApi()) {
      const apiDeliveries = await apiListDeliveries();
      return apiDeliveries.map(apiDeliveryToLocal);
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for getDeliveries, using local:", error);
  }
  
  return localGetDeliveries();
}

export async function saveDelivery(delivery: Omit<Delivery, "id" | "createdAt">): Promise<Delivery> {
  try {
    if (await shouldUseApi()) {
      const clientApiId = parseInt(delivery.clientId);
      const siteApiId = delivery.siteId ? parseInt(delivery.siteId) : undefined;
      
      if (!isNaN(clientApiId)) {
        const apiId = await apiCreateDelivery({
          clientId: clientApiId,
          clientName: delivery.clientName,
          clientCompany: delivery.clientCompany || undefined,
          siteId: siteApiId && !isNaN(siteApiId) ? siteApiId : undefined,
          siteName: delivery.siteName || undefined,
          driverName: delivery.driverName || undefined,
          startTime: new Date(delivery.startTime),
        });
        
        const newDelivery: Delivery = {
          ...delivery,
          id: String(apiId),
          createdAt: Date.now(),
        };
        
        return newDelivery;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for saveDelivery, using local:", error);
  }
  
  return localSaveDelivery(delivery);
}

export async function updateDelivery(id: string, updates: Partial<Delivery>): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(id);
      if (!isNaN(apiId)) {
        await apiUpdateDelivery(apiId, {
          endTime: updates.endTime ? new Date(updates.endTime) : undefined,
          litersDelivered: updates.litersDelivered,
          driverName: updates.driverName,
          photos: updates.photos,
        });
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for updateDelivery, using local:", error);
  }
  
  return localUpdateDelivery(id, updates);
}

export async function deleteDelivery(id: string): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(id);
      if (!isNaN(apiId)) {
        await apiDeleteDelivery(apiId);
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for deleteDelivery, using local:", error);
  }
  
  return localDeleteDelivery(id);
}

export async function getDeliveriesByClient(clientId: string): Promise<Delivery[]> {
  try {
    if (await shouldUseApi()) {
      const allDeliveries = await getDeliveries();
      return allDeliveries.filter((d) => d.clientId === clientId);
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for getDeliveriesByClient, using local:", error);
  }
  
  return localGetDeliveriesByClient(clientId);
}

// ============================================================
// INVOICE FUNCTIONS
// ============================================================

export async function getInvoices(): Promise<Invoice[]> {
  try {
    if (await shouldUseApi()) {
      const apiInvoices = await apiListInvoices();
      return apiInvoices.map(apiInvoiceToLocal);
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for getInvoices, using local:", error);
  }
  
  return localGetInvoices();
}

export async function saveInvoice(invoice: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> {
  try {
    if (await shouldUseApi()) {
      const deliveryApiId = parseInt(invoice.deliveryId);
      const clientApiId = parseInt(invoice.clientId);
      
      if (!isNaN(deliveryApiId) && !isNaN(clientApiId)) {
        const apiId = await apiCreateInvoice({
          deliveryId: deliveryApiId,
          clientId: clientApiId,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail || undefined,
          clientAddress: invoice.clientAddress || undefined,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: new Date(invoice.invoiceDate),
          serviceFee: Math.round(invoice.serviceFee * 100), // Convert to cents
          pricePerLiter: Math.round(invoice.pricePerLiter * 100),
          litersDelivered: invoice.litersDelivered,
          subtotal: Math.round(invoice.subtotal * 100),
          gst: Math.round(invoice.gst * 100),
          qst: Math.round(invoice.qst * 100),
          total: Math.round(invoice.total * 100),
          status: invoice.status,
        });
        
        const newInvoice: Invoice = {
          ...invoice,
          id: String(apiId),
          createdAt: Date.now(),
        };
        
        return newInvoice;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for saveInvoice, using local:", error);
  }
  
  return localSaveInvoice(invoice);
}

export async function getInvoicesByDelivery(deliveryId: string): Promise<Invoice[]> {
  try {
    if (await shouldUseApi()) {
      const allInvoices = await getInvoices();
      return allInvoices.filter((inv) => inv.deliveryId === deliveryId);
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for getInvoicesByDelivery, using local:", error);
  }
  
  return localGetInvoicesByDelivery(deliveryId);
}

export async function updateInvoiceStatus(invoiceId: string, status: Invoice["status"]): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(invoiceId);
      if (!isNaN(apiId)) {
        await apiUpdateInvoiceStatus(apiId, status);
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for updateInvoiceStatus, using local:", error);
  }
  
  return localUpdateInvoiceStatus(invoiceId, status);
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(invoiceId);
      if (!isNaN(apiId)) {
        await apiDeleteInvoice(apiId);
        return;
      }
    }
  } catch (error) {
    console.warn("[ApiStorage] API unavailable for deleteInvoice, using local:", error);
  }
  
  return localDeleteInvoice(invoiceId);
}
