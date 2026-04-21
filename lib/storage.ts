import AsyncStorage from "@react-native-async-storage/async-storage";
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
  apiUpdateInvoiceStatus as apiUpdateInvoiceStatusFn,
  apiDeleteInvoice,
  apiListEquipment,
  apiCreateEquipment,
  apiDeleteEquipment,
  apiGetClientEquipment,
  apiSetClientEquipment,
  ApiClient,
  ApiSite,
  ApiDelivery,
  ApiInvoice,
  ApiEquipment,
} from "./api-client";
import { getAuthToken } from "./auth-context";

// Check if we should use API (token available)
async function shouldUseApi(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

// Data Models
export interface Driver {
  id: string;
  name: string;
  createdAt: number;
}

export interface Shift {
  id: string;
  driverId: string;
  driverName: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  email?: string;
  notes: string;
  equipmentIds?: string[]; // Equipment IDs assigned to this client
  createdAt: number;
}

export interface Site {
  id: string;
  clientId: string;
  name: string;
  address: string;
  createdAt: number;
}

export interface DeliveryUnit {
  id: string;
  unitName: string; // e.g., "Camion 1", "Réservoir A"
  liters: number;
}

export interface Delivery {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  siteId: string;
  siteName: string;
  driverName?: string; // Driver name
  startTime: number;
  endTime: number;
  units: DeliveryUnit[]; // Multiple units with liters each
  litersDelivered: number; // Total liters (calculated from units)
  photos: string[]; // Array of photo URIs
  createdAt: number;
}

export interface Invoice {
  id: string;
  deliveryId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  invoiceNumber: string;
  invoiceDate: number;
  serviceFee: number; // $40
  pricePerLiter: number; // $2.00
  litersDelivered: number;
  subtotal: number;
  gst: number; // 5%
  qst: number; // 9.975%
  total: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: number;
}

// Storage Keys
const CLIENTS_KEY = "@urea_delivery_clients";
const SITES_KEY = "@urea_delivery_sites";
const DELIVERIES_KEY = "@urea_delivery_deliveries";
const INVOICES_KEY = "@urea_delivery_invoices";

// ============================================================
// API -> Local type converters
// ============================================================
function apiClientToLocal(c: ApiClient): Client {
  return {
    id: String(c.id),
    name: c.name,
    company: c.company ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    email: c.email ?? undefined,
    notes: c.notes ?? "",
    createdAt: new Date(c.createdAt).getTime(),
  };
}

function apiSiteToLocal(s: ApiSite): Site {
  return {
    id: String(s.id),
    clientId: String(s.clientId),
    name: s.name,
    address: s.address ?? "",
    createdAt: new Date(s.createdAt).getTime(),
  };
}

function apiDeliveryToLocal(d: ApiDelivery): Delivery {
  return {
    id: String(d.id),
    clientId: String(d.clientId),
    clientName: d.clientName,
    clientCompany: d.clientCompany ?? "",
    siteId: String(d.siteId ?? ""),
    siteName: d.siteName ?? "",
    driverName: d.driverName ?? undefined,
    startTime: new Date(d.startTime).getTime(),
    endTime: d.endTime ? new Date(d.endTime).getTime() : 0,
    units: [],
    litersDelivered: d.litersDelivered,
    photos: d.photos ?? [],
    createdAt: new Date(d.createdAt).getTime(),
  };
}

function apiInvoiceToLocal(inv: ApiInvoice): Invoice {
  return {
    id: String(inv.id),
    deliveryId: String(inv.deliveryId),
    clientId: String(inv.clientId),
    clientName: inv.clientName,
    clientEmail: inv.clientEmail ?? undefined,
    clientAddress: inv.clientAddress ?? undefined,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: new Date(inv.invoiceDate).getTime(),
    // API stores values in cents, convert back to dollars
    serviceFee: inv.serviceFee / 100,
    pricePerLiter: inv.pricePerLiter / 100,
    litersDelivered: inv.litersDelivered,
    subtotal: inv.subtotal / 100,
    gst: inv.gst / 100,
    qst: inv.qst / 100,
    total: inv.total / 100,
    status: inv.status,
    createdAt: new Date(inv.createdAt).getTime(),
  };
}

// Client Functions
export async function getClients(): Promise<Client[]> {
  try {
    if (await shouldUseApi()) {
      const apiClients = await apiListClients();
      const localClients = apiClients.map(apiClientToLocal);
      // Cache locally
      await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(localClients)).catch(() => {});
      return localClients;
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for getClients, using local:", error);
  }
  try {
    const data = await AsyncStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading clients:", error);
    return [];
  }
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
      return { ...client, id: String(apiId), createdAt: Date.now() };
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for saveClient, using local:", error);
  }
  try {
    const clients = await getClients();
    const newClient: Client = { ...client, id: Date.now().toString(), createdAt: Date.now() };
    clients.push(newClient);
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    return newClient;
  } catch (error) {
    console.error("Error saving client:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for updateClient, using local:", error);
  }
  try {
    const clients = await getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for deleteClient, using local:", error);
  }
  try {
    const clients = await getClients();
    const filtered = clients.filter((c) => c.id !== id);
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
}

// Site Functions
export async function getSites(): Promise<Site[]> {
  try {
    const data = await AsyncStorage.getItem(SITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading sites:", error);
    return [];
  }
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
        return { ...site, id: String(apiId), createdAt: Date.now() };
      }
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for saveSite, using local:", error);
  }
  try {
    const sites = await getSites();
    const newSite: Site = { ...site, id: Date.now().toString(), createdAt: Date.now() };
    sites.push(newSite);
    await AsyncStorage.setItem(SITES_KEY, JSON.stringify(sites));
    return newSite;
  } catch (error) {
    console.error("Error saving site:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for updateSite, using local:", error);
  }
  try {
    const sites = await getSites();
    const index = sites.findIndex((s) => s.id === id);
    if (index !== -1) {
      sites[index] = { ...sites[index], ...updates };
      await AsyncStorage.setItem(SITES_KEY, JSON.stringify(sites));
    }
  } catch (error) {
    console.error("Error updating site:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for deleteSite, using local:", error);
  }
  try {
    const sites = await getSites();
    const filtered = sites.filter((s) => s.id !== id);
    await AsyncStorage.setItem(SITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting site:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for getSitesByClient, using local:", error);
  }
  try {
    const sites = await getSites();
    return sites.filter((s) => s.clientId === clientId);
  } catch (error) {
    console.error("Error loading client sites:", error);
    return [];
  }
}

// Delivery Functions
export async function getDeliveries(): Promise<Delivery[]> {
  try {
    if (await shouldUseApi()) {
      const apiDeliveries = await apiListDeliveries();
      return apiDeliveries.map(apiDeliveryToLocal);
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for getDeliveries, using local:", error);
  }
  try {
    const data = await AsyncStorage.getItem(DELIVERIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading deliveries:", error);
    return [];
  }
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
        return { ...delivery, id: String(apiId), createdAt: Date.now() };
      }
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for saveDelivery, using local:", error);
  }
  try {
    const deliveries = await getDeliveries();
    const newDelivery: Delivery = { ...delivery, id: Date.now().toString(), createdAt: Date.now() };
    deliveries.push(newDelivery);
    await AsyncStorage.setItem(DELIVERIES_KEY, JSON.stringify(deliveries));
    return newDelivery;
  } catch (error) {
    console.error("Error saving delivery:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for deleteDelivery, using local:", error);
  }
  try {
    const deliveries = await getDeliveries();
    const filtered = deliveries.filter((d) => d.id !== id);
    await AsyncStorage.setItem(DELIVERIES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting delivery:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for updateDelivery, using local:", error);
  }
  try {
    const deliveries = await getDeliveries();
    const index = deliveries.findIndex((d) => d.id === id);
    if (index !== -1) {
      deliveries[index] = { ...deliveries[index], ...updates };
      await AsyncStorage.setItem(DELIVERIES_KEY, JSON.stringify(deliveries));
    }
  } catch (error) {
    console.error("Error updating delivery:", error);
    throw error;
  }
}

export async function getDeliveriesByClient(clientId: string): Promise<Delivery[]> {
  try {
    if (await shouldUseApi()) {
      const allDeliveries = await getDeliveries();
      return allDeliveries.filter((d) => d.clientId === clientId);
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for getDeliveriesByClient, using local:", error);
  }
  try {
    const deliveries = await getDeliveries();
    return deliveries.filter((d) => d.clientId === clientId);
  } catch (error) {
    console.error("Error loading client deliveries:", error);
    return [];
  }
}


// Invoice Pricing Constants
export const INVOICE_CONFIG = {
  PRICE_PER_LITER: 2.0,
  GST_RATE: 0.05,
  QST_RATE: 0.09975,
};

// Get service fee based on volume
function getServiceFee(litersDelivered: number): number {
  return litersDelivered < 500 ? 50 : 0;
}

// Invoice calculation function
export function calculateInvoice(litersDelivered: number) {
  const serviceFee = getServiceFee(litersDelivered);
  const deliveryCost = litersDelivered * INVOICE_CONFIG.PRICE_PER_LITER;
  const subtotal = serviceFee + deliveryCost;
  const gst = subtotal * INVOICE_CONFIG.GST_RATE;
  const qst = subtotal * INVOICE_CONFIG.QST_RATE;
  const total = subtotal + gst + qst;
  
  return {
    serviceFee,
    pricePerLiter: INVOICE_CONFIG.PRICE_PER_LITER,
    deliveryCost,
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    qst: Math.round(qst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Invoice Functions
export async function getInvoices(): Promise<Invoice[]> {
  try {
    if (await shouldUseApi()) {
      const apiInvoices = await apiListInvoices();
      return apiInvoices.map(apiInvoiceToLocal);
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for getInvoices, using local:", error);
  }
  try {
    const data = await AsyncStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading invoices:", error);
    return [];
  }
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
          serviceFee: Math.round(invoice.serviceFee * 100),
          pricePerLiter: Math.round(invoice.pricePerLiter * 100),
          litersDelivered: invoice.litersDelivered,
          subtotal: Math.round(invoice.subtotal * 100),
          gst: Math.round(invoice.gst * 100),
          qst: Math.round(invoice.qst * 100),
          total: Math.round(invoice.total * 100),
          status: invoice.status,
        });
        return { ...invoice, id: String(apiId), createdAt: Date.now() };
      }
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for saveInvoice, using local:", error);
  }
  try {
    const invoices = await getInvoices();
    const newInvoice: Invoice = { ...invoice, id: Date.now().toString(), createdAt: Date.now() };
    invoices.push(newInvoice);
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    return newInvoice;
  } catch (error) {
    console.error("Error saving invoice:", error);
    throw error;
  }
}

export async function getInvoicesByDelivery(deliveryId: string): Promise<Invoice[]> {
  try {
    if (await shouldUseApi()) {
      const allInvoices = await getInvoices();
      return allInvoices.filter((inv) => inv.deliveryId === deliveryId);
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for getInvoicesByDelivery, using local:", error);
  }
  try {
    const invoices = await getInvoices();
    return invoices.filter((inv) => inv.deliveryId === deliveryId);
  } catch (error) {
    console.error("Error getting invoices by delivery:", error);
    return [];
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const apiId = parseInt(invoiceId);
      if (!isNaN(apiId)) {
        await apiUpdateInvoiceStatusFn(apiId, status);
        return;
      }
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for updateInvoiceStatus, using local:", error);
  }
  try {
    const invoices = await getInvoices();
    const index = invoices.findIndex((inv) => inv.id === invoiceId);
    if (index >= 0) {
      invoices[index].status = status;
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    }
  } catch (error) {
    console.error("Error updating invoice status:", error);
    throw error;
  }
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
    console.warn("[Storage] API unavailable for deleteInvoice, using local:", error);
  }
  try {
    const invoices = await getInvoices();
    const filtered = invoices.filter((inv) => inv.id !== invoiceId);
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
}


// Storage Keys
const DRIVERS_KEY = "drivers";
const SHIFTS_KEY = "shifts";

// Driver Functions
export async function getDrivers(): Promise<Driver[]> {
  try {
    const data = await AsyncStorage.getItem(DRIVERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting drivers:", error);
    return [];
  }
}

export async function saveDriver(driver: Driver): Promise<void> {
  try {
    const drivers = await getDrivers();
    const index = drivers.findIndex((d) => d.id === driver.id);
    if (index >= 0) {
      drivers[index] = driver;
    } else {
      drivers.push(driver);
    }
    await AsyncStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
  } catch (error) {
    console.error("Error saving driver:", error);
    throw error;
  }
}

export async function addDriver(name: string): Promise<Driver> {
  const driver: Driver = {
    id: Date.now().toString(),
    name,
    createdAt: Date.now(),
  };
  await saveDriver(driver);
  return driver;
}

export async function deleteDriver(driverId: string): Promise<void> {
  try {
    const drivers = await getDrivers();
    const filtered = drivers.filter((d) => d.id !== driverId);
    await AsyncStorage.setItem(DRIVERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting driver:", error);
    throw error;
  }
}

// Shift Functions
export async function getShifts(): Promise<Shift[]> {
  try {
    const data = await AsyncStorage.getItem(SHIFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting shifts:", error);
    return [];
  }
}

export async function saveShift(shift: Shift): Promise<void> {
  try {
    const shifts = await getShifts();
    const index = shifts.findIndex((s) => s.id === shift.id);
    if (index >= 0) {
      shifts[index] = shift;
    } else {
      shifts.push(shift);
    }
    await AsyncStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
  } catch (error) {
    console.error("Error saving shift:", error);
    throw error;
  }
}

export async function startShift(driverId: string, driverName: string): Promise<Shift> {
  // End any active shift for this driver
  const shifts = await getShifts();
  const activeShift = shifts.find((s) => s.driverId === driverId && s.isActive);
  if (activeShift) {
    activeShift.isActive = false;
    activeShift.endTime = Date.now();
    await saveShift(activeShift);
  }

  const shift: Shift = {
    id: Date.now().toString(),
    driverId,
    driverName,
    startTime: Date.now(),
    isActive: true,
  };
  await saveShift(shift);
  return shift;
}

export async function endShift(driverId: string): Promise<void> {
  const shifts = await getShifts();
  const activeShift = shifts.find((s) => s.driverId === driverId && s.isActive);
  if (activeShift) {
    activeShift.isActive = false;
    activeShift.endTime = Date.now();
    await saveShift(activeShift);
  }
}

export async function getActiveShift(driverId: string): Promise<Shift | null> {
  const shifts = await getShifts();
  return shifts.find((s) => s.driverId === driverId && s.isActive) || null;
}

export async function getCurrentDriver(): Promise<Driver | null> {
  try {
    const data = await AsyncStorage.getItem("currentDriver");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting current driver:", error);
    return null;
  }
}

export async function setCurrentDriver(driver: Driver | null): Promise<void> {
  try {
    if (driver) {
      await AsyncStorage.setItem("currentDriver", JSON.stringify(driver));
    } else {
      await AsyncStorage.removeItem("currentDriver");
    }
  } catch (error) {
    console.error("Error setting current driver:", error);
    throw error;
  }
}


// Invoice Status Management Functions
export async function getUnpaidInvoices(): Promise<Invoice[]> {
  try {
    const invoices = await getInvoices();
    return invoices.filter((inv) => inv.status !== 'paid');
  } catch (error) {
    console.error("Error getting unpaid invoices:", error);
    return [];
  }
}

export async function getOverdueInvoices(daysOverdue: number = 10): Promise<Invoice[]> {
  try {
    const invoices = await getInvoices();
    const cutoffDate = Date.now() - (daysOverdue * 24 * 60 * 60 * 1000);
    return invoices.filter((inv) => inv.status !== 'paid' && inv.invoiceDate < cutoffDate);
  } catch (error) {
    console.error("Error getting overdue invoices:", error);
    return [];
  }
}

export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  await updateInvoiceStatus(invoiceId, 'paid');
}

export async function markInvoiceAsUnpaid(invoiceId: string): Promise<void> {
  await updateInvoiceStatus(invoiceId, 'sent');
}


// Equipment Management
export interface Equipment {
  id: string;
  name: string;
  capacity?: number; // Optional capacity in liters
  createdAt: number;
}

const EQUIPMENT_KEY = "equipment_list";

export async function getEquipment(): Promise<Equipment[]> {
  try {
    if (await shouldUseApi()) {
      const apiEquipment = await apiListEquipment();
      return apiEquipment.map((eq) => ({
        id: eq.id.toString(),
        name: eq.name,
        capacity: eq.capacity,
        createdAt: new Date(eq.createdAt).getTime(),
      }));
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for getEquipment, using local:", error);
  }
  try {
    const data = await AsyncStorage.getItem(EQUIPMENT_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting equipment:", error);
    return [];
  }
}

export async function addEquipment(name: string, capacity?: number): Promise<Equipment> {
  try {
    if (await shouldUseApi()) {
      const apiEquipment = await apiCreateEquipment({ name, capacity });
      return {
        id: apiEquipment.id.toString(),
        name: apiEquipment.name,
        capacity: apiEquipment.capacity,
        createdAt: new Date(apiEquipment.createdAt).getTime(),
      };
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for addEquipment, using local:", error);
  }
  try {
    const equipment: Equipment = {
      id: Date.now().toString(),
      name,
      capacity,
      createdAt: Date.now(),
    };
    const list = await getEquipment();
    list.push(equipment);
    await AsyncStorage.setItem(EQUIPMENT_KEY, JSON.stringify(list));
    return equipment;
  } catch (error) {
    console.error("Error adding equipment:", error);
    throw error;
  }
}

export async function deleteEquipment(equipmentId: string): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const numId = parseInt(equipmentId);
      if (!isNaN(numId)) {
        await apiDeleteEquipment(numId);
        return;
      }
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for deleteEquipment, using local:", error);
  }
  try {
    const list = await getEquipment();
    const filtered = list.filter((e) => e.id !== equipmentId);
    await AsyncStorage.setItem(EQUIPMENT_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
}

export async function updateEquipment(equipment: Equipment): Promise<void> {
  try {
    const list = await getEquipment();
    const index = list.findIndex((e) => e.id === equipment.id);
    if (index >= 0) {
      list[index] = equipment;
      await AsyncStorage.setItem(EQUIPMENT_KEY, JSON.stringify(list));
    }
  } catch (error) {
    console.error("Error updating equipment:", error);
    throw error;
  }
}


// Client Equipment Management
export async function updateClientEquipment(clientId: string, equipmentIds: string[]): Promise<void> {
  try {
    if (await shouldUseApi()) {
      const numClientId = parseInt(clientId);
      const numEquipmentIds = equipmentIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (!isNaN(numClientId)) {
        await apiSetClientEquipment(numClientId, numEquipmentIds);
        return;
      }
    }
  } catch (error) {
    console.warn("[Storage] API unavailable for updateClientEquipment, using local:", error);
  }
  try {
    const clients = await getClients();
    const index = clients.findIndex((c) => c.id === clientId);
    if (index >= 0) {
      clients[index].equipmentIds = equipmentIds;
      await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
  } catch (error) {
    console.error("Error updating client equipment:", error);
    throw error;
  }
}

export async function getClientEquipment(clientId: string): Promise<Equipment[]> {
  try {
    const clients = await getClients();
    const client = clients.find((c) => c.id === clientId);
    if (!client || !client.equipmentIds) {
      return [];
    }
    const allEquipment = await getEquipment();
    return allEquipment.filter((e) => client.equipmentIds?.includes(e.id));
  } catch (error) {
    console.error("Error getting client equipment:", error);
    return [];
  }
}
