import AsyncStorage from "@react-native-async-storage/async-storage";

const PORTAL_URL = "https://portail.sp-logistix.com";
const PORTAL_API_TOKEN = "78f1f915800411b61a7133928a67970339f05712764ae8824a06f013564e9af5";
const CLIENTS_CACHE_KEY = "portal_clients_cache";
const CLIENTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PortalClient {
  id: number;
  code: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  classe?: string;
  sousClasse?: string;
  siteStatus?: string;
  managementType?: string;
  btuName?: string;
  siteType?: string;
  aliases?: string;
  emailSender?: string;
}

export interface PortalClientsResult {
  success: boolean;
  clients: PortalClient[];
  count?: number;
  fromCache?: boolean;
  error?: string;
}

/**
 * Récupère la liste de tous les clients depuis le portail SP Logistix.
 * Utilise un cache AsyncStorage de 5 minutes pour éviter les appels répétés.
 */
export async function getPortalClients(): Promise<PortalClientsResult> {
  try {
    // Vérifier le cache d'abord
    const cached = await AsyncStorage.getItem(CLIENTS_CACHE_KEY);
    if (cached) {
      const { clients, cachedAt } = JSON.parse(cached);
      if (Date.now() - cachedAt < CLIENTS_CACHE_TTL) {
        return { success: true, clients, count: clients.length, fromCache: true };
      }
    }

    // Appel API
    const response = await fetch(`${PORTAL_URL}/api/clients`, {
      method: "GET",
      headers: { "x-api-token": PORTAL_API_TOKEN },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erreur lors de la récupération des clients");

    const clients: PortalClient[] = data.clients || [];

    // Mettre en cache
    await AsyncStorage.setItem(CLIENTS_CACHE_KEY, JSON.stringify({ clients, cachedAt: Date.now() }));

    return { success: true, clients, count: clients.length };
  } catch (error: any) {
    // Retourner le cache expiré en cas d'erreur réseau
    try {
      const cached = await AsyncStorage.getItem(CLIENTS_CACHE_KEY);
      if (cached) {
        const { clients } = JSON.parse(cached);
        return { success: true, clients, count: clients.length, fromCache: true };
      }
    } catch {}
    return { success: false, clients: [], error: error?.message };
  }
}

/**
 * Force le rechargement des clients depuis le portail (ignore le cache)
 */
export async function refreshPortalClients(): Promise<PortalClientsResult> {
  await AsyncStorage.removeItem(CLIENTS_CACHE_KEY);
  return getPortalClients();
}

/**
 * Recherche un client par son code portail
 */
export async function findPortalClientByCode(code: string): Promise<PortalClient | null> {
  const result = await getPortalClients();
  if (!result.success) return null;
  return result.clients.find(c => c.code.toLowerCase() === code.toLowerCase()) || null;
}
