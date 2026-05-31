/**
 * portal-units.ts
 * Gestion des unités de livraison depuis le portail SP Logistix
 *
 * Ce module permet à l'APK de :
 * 1. Récupérer la liste des unités d'un client depuis le portail (GET)
 * 2. Ajouter une nouvelle unité depuis l'APK vers le portail (POST)
 *
 * Les unités sont synchronisées en temps réel : toute unité ajoutée sur le portail
 * apparaît immédiatement dans l'APK lors d'une livraison pour ce client.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const PORTAL_URL = "https://portail.sp-logistix.com";
const PORTAL_API_TOKEN = "78f1f915800411b61a7133928a67970339f05712764ae8824a06f013564e9af5";

// Cache local des unités (pour fonctionnement hors-ligne)
const UNITS_CACHE_KEY_PREFIX = "portal_units_";

export interface PortalClientUnit {
  id: number;
  unitName: string;
  description?: string;
  sortOrder: number;
  isActive: number;
}

export interface PortalUnitsResult {
  success: boolean;
  clientName?: string;
  units: PortalClientUnit[];
  fromCache?: boolean;
  error?: string;
}

/**
 * Récupère les unités pré-configurées d'un client depuis le portail.
 * En cas d'erreur réseau, retourne le cache local.
 */
export async function getPortalClientUnits(clientCode: string): Promise<PortalUnitsResult> {
  const cacheKey = `${UNITS_CACHE_KEY_PREFIX}${clientCode}`;

  try {
    const response = await fetch(`${PORTAL_URL}/api/units/${clientCode}`, {
      method: "GET",
      headers: {
        "x-api-token": PORTAL_API_TOKEN,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des unités");
    }

    // Mettre en cache les unités
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      clientName: data.clientName,
      units: data.units,
      cachedAt: Date.now(),
    }));

    return {
      success: true,
      clientName: data.clientName,
      units: data.units || [],
    };
  } catch (error: any) {
    console.warn("[PortalUnits] Erreur réseau, utilisation du cache:", error?.message);

    // Retourner le cache local si disponible
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { clientName, units } = JSON.parse(cached);
        return {
          success: true,
          clientName,
          units: units || [],
          fromCache: true,
        };
      }
    } catch {}

    return {
      success: false,
      units: [],
      error: error?.message || "Impossible de contacter le portail",
    };
  }
}

/**
 * Ajoute une nouvelle unité depuis l'APK vers le portail.
 * L'unité sera immédiatement visible sur le portail et dans l'APK.
 */
export async function addPortalClientUnit(
  clientCode: string,
  unit: { unitName: string; description?: string; sortOrder?: number }
): Promise<{ success: boolean; id?: number; message?: string; error?: string }> {
  try {
    const response = await fetch(`${PORTAL_URL}/api/units/${clientCode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": PORTAL_API_TOKEN,
      },
      body: JSON.stringify({ ...unit, apiToken: PORTAL_API_TOKEN }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Erreur lors de l'ajout de l'unité" };
    }

    // Invalider le cache pour forcer un rechargement
    const cacheKey = `${UNITS_CACHE_KEY_PREFIX}${clientCode}`;
    await AsyncStorage.removeItem(cacheKey);

    return { success: true, id: data.id, message: data.message };
  } catch (error: any) {
    console.error("[PortalUnits] Erreur ajout unité:", error);
    return {
      success: false,
      error: error?.message || "Impossible de contacter le portail",
    };
  }
}
