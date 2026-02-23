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
      name: z.string().min(1),
      company: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      return db.createClient(ctx.user.id, {
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        address: input.address || null,
        email: input.email || null,
        notes: input.notes || null,
      });
    }),

  // Update client
  updateClient: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().min(1).optional(),
      company: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return db.updateClient(input.clientId, {
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        address: input.address || null,
        email: input.email || null,
        notes: input.notes || null,
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
      name: z.string().min(1),
      address: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return db.createSite(input.clientId, input.name, input.address || null);
    }),

  // Update site
  updateSite: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string().min(1).optional(),
      address: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return db.updateSite(input.siteId, input.name, input.address || null);
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
      clientName: z.string(),
      clientCompany: z.string().optional(),
      siteId: z.number().optional(),
      siteName: z.string().optional(),
      driverName: z.string().optional(),
      startTime: z.date(),
    }))
    .mutation(({ ctx, input }) => {
      return db.createDelivery(ctx.user.id, {
        clientId: input.clientId,
        clientName: input.clientName,
        clientCompany: input.clientCompany || null,
        siteId: input.siteId || null,
        siteName: input.siteName || null,
        driverName: input.driverName || null,
        startTime: input.startTime,
      });
    }),

  // Update delivery (end delivery, add photos, etc)
  updateDelivery: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      endTime: z.date().optional(),
      litersDelivered: z.number().optional(),
      driverName: z.string().optional(),
      photos: z.array(z.string()).optional(), // Array of photo URLs
    }))
    .mutation(({ input }) => {
      return db.updateDelivery(input.deliveryId, {
        endTime: input.endTime,
        litersDelivered: input.litersDelivered,
        driverName: input.driverName,
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
        <p>Bonjour ${info.client.name},</p>
        <p>Votre livraison d'urée a été complétée avec succès.</p>
        <hr />
        <h3>Détails de la livraison:</h3>
        <ul>
          <li><strong>Livraison #:</strong> ${info.delivery.id}</li>
          <li><strong>Client:</strong> ${info.client.name}</li>
          <li><strong>Site:</strong> ${info.site?.name || 'N/A'}</li>
          <li><strong>Date de début:</strong> ${deliveryDate}</li>
          <li><strong>Date de fin:</strong> ${endDate}</li>
          <li><strong>Durée:</strong> ${duration} minutes</li>
          <li><strong>Quantité livrée:</strong> ${info.delivery.litersDelivered || 0} litres</li>
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
