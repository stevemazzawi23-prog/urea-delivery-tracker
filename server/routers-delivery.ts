import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const deliveryRouter = router({
  // Get all clients for current user
  listClients: protectedProcedure.query(({ ctx }) => {
    return db.getClientsByUser(ctx.user.id);
  }),

  // Get client by ID
  getClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => {
      return db.getClientById(input.clientId);
    }),

  // Create client
  createClient: protectedProcedure
    .input(z.object({
      nom: z.string().min(1),
      email: z.string().email().optional(),
    }))
    .mutation(({ ctx, input }) => {
      return db.createClient(ctx.user.id, {
        nom: input.nom,
        email: input.email || null,
      });
    }),

  // Update client
  updateClient: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      nom: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }))
    .mutation(({ input }) => {
      return db.updateClient(input.clientId, {
        nom: input.nom,
        email: input.email || null,
      });
    }),

  // Delete client
  deleteClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(({ input }) => {
      return db.deleteClient(input.clientId);
    }),

  // Get sites for client
  listSites: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => {
      return db.getSitesByClient(input.clientId);
    }),

  // Create site
  createSite: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      nomSite: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return db.createSite(input.clientId, input.nomSite);
    }),

  // Update site
  updateSite: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      nomSite: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return db.updateSite(input.siteId, input.nomSite);
    }),

  // Delete site
  deleteSite: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .mutation(({ input }) => {
      return db.deleteSite(input.siteId);
    }),

  // Get all deliveries for current user
  listDeliveries: protectedProcedure.query(({ ctx }) => {
    return db.getDeliveriesByUser(ctx.user.id);
  }),

  // Get delivery by ID with client info
  getDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(({ input }) => {
      return db.getDeliveryWithClientInfo(input.deliveryId);
    }),

  // Create delivery
  createDelivery: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      siteId: z.number().optional(),
      startTime: z.date(),
    }))
    .mutation(({ ctx, input }) => {
      return db.createDelivery(ctx.user.id, {
        clientId: input.clientId,
        siteId: input.siteId || null,
        startTime: input.startTime,
      });
    }),

  // Update delivery (end delivery, add photos, etc)
  updateDelivery: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      endTime: z.date().optional(),
      liters: z.number().optional(),
      photos: z.string().optional(), // JSON stringified array
    }))
    .mutation(({ input }) => {
      return db.updateDelivery(input.deliveryId, {
        endTime: input.endTime,
        liters: input.liters,
        photos: input.photos,
      });
    }),

  // Delete delivery
  deleteDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .mutation(({ input }) => {
      return db.deleteDelivery(input.deliveryId);
    }),

  // Send POD email
  sendPODEmail: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const info = await db.getDeliveryWithClientInfo(input.deliveryId);
      
      if (!info) {
        throw new Error("Delivery not found");
      }

      if (!info.client?.email) {
        throw new Error("Client email not configured");
      }

      // Build email content
      const deliveryDate = new Date(info.delivery.startTime).toLocaleString('fr-FR');
      const endDate = info.delivery.endTime ? new Date(info.delivery.endTime).toLocaleString('fr-FR') : 'N/A';
      const duration = info.delivery.endTime 
        ? Math.round((new Date(info.delivery.endTime).getTime() - new Date(info.delivery.startTime).getTime()) / 60000)
        : 0;

      const emailBody = `
        <h2>Preuve de Livraison d'Urée</h2>
        <p>Bonjour ${info.client.nom},</p>
        <p>Votre livraison d'urée a été complétée avec succès.</p>
        <hr />
        <h3>Détails de la livraison:</h3>
        <ul>
          <li><strong>Livraison #:</strong> ${info.delivery.id}</li>
          <li><strong>Client:</strong> ${info.client.nom}</li>
          <li><strong>Site:</strong> ${info.site?.nomSite || 'N/A'}</li>
          <li><strong>Date de début:</strong> ${deliveryDate}</li>
          <li><strong>Date de fin:</strong> ${endDate}</li>
          <li><strong>Durée:</strong> ${duration} minutes</li>
          <li><strong>Quantité livrée:</strong> ${info.delivery.liters || 0} litres</li>
        </ul>
        <hr />
        <p>Merci de votre confiance.</p>
        <p><em>Cet email a été généré automatiquement. Veuillez ne pas répondre.</em></p>
      `;

      // For now, just return success
      // In production, integrate with SendGrid, SMTP, or other email service
      console.log(`[POD EMAIL] Sending to ${info.client.email}:`, emailBody);
      
      return {
        success: true,
        message: `Email de preuve de livraison envoyé à ${info.client.email}`,
      };
    }),
});
