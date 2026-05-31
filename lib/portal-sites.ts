/**
 * portal-sites.ts
 * Gestion des sites de livraison depuis le portail SP Logistix
 * 
 * Ce module permet à l'APK de :
 * 1. Récupérer la liste des sites d'un client depuis le portail (GET)
 * 2. Ajouter un nouveau site depuis l'APK vers le portail (POST)
 * 
 * Les sites sont synchronisés en temps réel : tout site ajouté sur le portail
 * apparaît immédiatement dans l'APK, et vice-versa.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const PORTAL_URL = "https://portail.sp-logistix.com";
const PORTAL_API_TOKEN = "78f1f915800411b61a7133928a67970339f05712764ae8824a06f013564e9af5";

// Cache local des sites (pour fonctionnement hors-ligne)
const SITES_CACHE_KEY_PREFIX = "portal_sites_";

export interface PortalSite {
  id: number;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  isActive: number;
}

export interface PortalSitesResult {
  success: boolean;
  clientName?: string;
  sites: PortalSite[];
  fromCache?: boolean;
  error?: string;
}

/**
 * Récupère les sites de livraison d'un client depuis le portail.
 * En cas d'erreur réseau, retourne le cache local.
 */
export async function getPortalSites(clientCode: string): Promise<PortalSitesResult> {
  const cacheKey = `${SITES_CACHE_KEY_PREFIX}${clientCode}`;

  try {
    const response = await fetch(`${PORTAL_URL}/api/sites/${clientCode}`, {
      method: "GET",
      headers: {
        "x-api-token": PORTAL_API_TOKEN,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des sites");
    }

    // Mettre en cache les sites
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      clientName: data.clientName,
      sites: data.sites,
      cachedAt: Date.now(),
    }));

    return {
      success: true,
      clientName: data.clientName,
      sites: data.sites || [],
    };
  } catch (error: any) {
    console.warn("[PortalSites] Erreur réseau, utilisation du cache:", error?.message);

    // Retourner le cache local si disponible
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { clientName, sites } = JSON.parse(cached);
        return {
          success: true,
          clientName,
          sites: sites || [],
          fromCache: true,
        };
      }
    } catch {}

    return {
      success: false,
      sites: [],
      error: error?.message || "Impossible de contacter le portail",
    };
  }
}

/**
 * Ajoute un nouveau site de livraison depuis l'APK vers le portail.
 * Le site sera immédiatement visible sur le portail et dans l'APK.
 */
export async function addPortalSite(
  clientCode: string,
  site: { name: string; address?: string; city?: string; province?: string; postalCode?: string; notes?: string }
): Promise<{ success: boolean; id?: number; message?: string; error?: string }> {
  try {
    const response = await fetch(`${PORTAL_URL}/api/sites/${clientCode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": PORTAL_API_TOKEN,
      },
      body: JSON.stringify({ ...site, apiToken: PORTAL_API_TOKEN }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Erreur lors de l'ajout du site" };
    }

    // Invalider le cache pour forcer un rechargement
    const cacheKey = `${SITES_CACHE_KEY_PREFIX}${clientCode}`;
    await AsyncStorage.removeItem(cacheKey);

    return { success: true, id: data.id, message: data.message };
  } catch (error: any) {
    console.error("[PortalSites] Erreur ajout site:", error);
    return {
      success: false,
      error: error?.message || "Impossible de contacter le portail",
    };
  }
}
