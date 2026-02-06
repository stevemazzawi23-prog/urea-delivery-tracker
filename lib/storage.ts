import AsyncStorage from "@react-native-async-storage/async-storage";

// Data Models
export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
}

export interface Delivery {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  startTime: number;
  endTime: number;
  litersDelivered: number;
  createdAt: number;
}

// Storage Keys
const CLIENTS_KEY = "@urea_delivery_clients";
const DELIVERIES_KEY = "@urea_delivery_deliveries";

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
