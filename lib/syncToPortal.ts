/**
 * Synchronisation des billets de livraison vers le portail SP Logistix
 * Envoie automatiquement les billets créés dans l'APK au portail
 */

import { Platform } from 'react-native';

const PORTAL_BASE_URL = 'https://portail.sp-logistix.com';
const API_TOKEN = '78f1f915800411b61a7133928a67970339f05712764ae8824a06f013564e9af5';

export interface DeliveryTicket {
  clientCode: string;
  ticketNumber: string;
  deliveryDate: string | Date;
  volumeTotal: string | number;
  pieces?: number;
  locationCode?: string;
  duration?: string;
}

/**
 * Envoie un billet de livraison au portail SP Logistix
 * @param ticket Les données du billet à synchroniser
 * @returns true si la synchronisation a réussi, false sinon
 */
export async function syncTicketToPortal(ticket: DeliveryTicket): Promise<boolean> {
  try {
    // Formater la date si nécessaire
    const deliveryDate = ticket.deliveryDate instanceof Date
      ? ticket.deliveryDate.toISOString().split('T')[0]
      : ticket.deliveryDate;

    const payload = {
      input: {
        apiToken: API_TOKEN,
        clientCode: ticket.clientCode,
        ticketNumber: ticket.ticketNumber,
        deliveryDate,
        volumeTotal: String(ticket.volumeTotal),
        pieces: ticket.pieces,
        locationCode: ticket.locationCode,
        duration: ticket.duration,
      },
    };

    console.log('[Portal Sync] Envoi du billet:', ticket.ticketNumber, 'pour client:', ticket.clientCode);

    const response = await fetch(
      `${PORTAL_BASE_URL}/api/trpc/tickets.importFromAPK`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Urea-Delivery-Tracker-APK/1.0',
        },
        body: JSON.stringify(payload),
        timeout: 10000, // 10 secondes de timeout
      }
    );

    if (!response.ok) {
      console.error('[Portal Sync] Erreur HTTP:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();

    if (data.error) {
      console.error('[Portal Sync] Erreur du portail:', data.error.message);
      return false;
    }

    if (data.result?.success) {
      console.log('[Portal Sync] ✅ Billet synchronisé avec succès:', data.result.message);
      return true;
    }

    console.warn('[Portal Sync] Réponse inattendue:', data);
    return false;
  } catch (error) {
    console.error('[Portal Sync] Erreur lors de la synchronisation:', error);
    // Ne pas lever l'erreur - la création locale du billet doit réussir même si la sync échoue
    return false;
  }
}

/**
 * Synchronise un billet de manière asynchrone (sans bloquer)
 * Utile pour envoyer les billets en arrière-plan
 */
export function syncTicketToPortalAsync(ticket: DeliveryTicket): void {
  // Envoyer la synchronisation en arrière-plan
  syncTicketToPortal(ticket).catch(error => {
    console.error('[Portal Sync] Erreur asynchrone:', error);
  });
}

/**
 * Vérifie la connexion au portail
 */
export async function checkPortalConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${PORTAL_BASE_URL}/api/trpc/auth.me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Urea-Delivery-Tracker-APK/1.0',
      },
      body: JSON.stringify({ input: {} }),
      timeout: 5000,
    });

    return response.ok;
  } catch (error) {
    console.error('[Portal Sync] Portail non accessible:', error);
    return false;
  }
}
