import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Client Functions
export async function getClients(): Promise<Client[]> {
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
    const clients = await getClients();
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
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
    const sites = await getSites();
    const newSite: Site = {
      ...site,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
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
    const data = await AsyncStorage.getItem(DELIVERIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading deliveries:", error);
    return [];
  }
}

export async function saveDelivery(delivery: Omit<Delivery, "id" | "createdAt">): Promise<Delivery> {
  try {
    const deliveries = await getDeliveries();
    const newDelivery: Delivery = {
      ...delivery,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
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
    const deliveries = await getDeliveries();
    const filtered = deliveries.filter((d) => d.id !== id);
    await AsyncStorage.setItem(DELIVERIES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting delivery:", error);
    throw error;
  }
}

export async function getDeliveriesByClient(clientId: string): Promise<Delivery[]> {
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
  GST_RATE: 0.05,
  QST_RATE: 0.09975,
};

// Get price per liter based on volume
function getPricePerLiter(litersDelivered: number): number {
  if (litersDelivered >= 500) {
    return 1.50;
  } else if (litersDelivered >= 200) {
    return 2.175; // Average of 1.90 and 2.45
  } else {
    return 2.70; // Average of 2.50 and 2.90
  }
}

// Get service fee based on volume
function getServiceFee(litersDelivered: number): number {
  return litersDelivered < 500 ? 50 : 0;
}

// Invoice calculation function
export function calculateInvoice(litersDelivered: number) {
  const pricePerLiter = getPricePerLiter(litersDelivered);
  const serviceFee = getServiceFee(litersDelivered);
  const deliveryCost = litersDelivered * pricePerLiter;
  const subtotal = serviceFee + deliveryCost;
  const gst = subtotal * INVOICE_CONFIG.GST_RATE;
  const qst = subtotal * INVOICE_CONFIG.QST_RATE;
  const total = subtotal + gst + qst;
  
  return {
    serviceFee,
    pricePerLiter,
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
    const data = await AsyncStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading invoices:", error);
    return [];
  }
}

export async function saveInvoice(invoice: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> {
  try {
    const invoices = await getInvoices();
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
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
    const invoices = await getInvoices();
    return invoices.filter((inv) => inv.deliveryId === deliveryId);
  } catch (error) {
    console.error("Error getting invoices by delivery:", error);
    return [];
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<void> {
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
