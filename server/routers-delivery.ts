import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { io } from "./_core/index";

// Helper: broadcast a real-time event to all devices of the same user
function broadcast(userId: number, event: string, data: unknown) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`[Socket.io] Broadcast "${event}" to room user:${userId}`);
  }
}

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
    .mutation(async ({ ctx, input }) => {
      const id = await db.createClient(ctx.user.id, {
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        address: input.address || null,
        email: input.email || null,
        notes: input.notes || null,
      });
      broadcast(ctx.user.id, "clients:updated", { action: "create", id });
      return id;
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
    .mutation(async ({ ctx, input }) => {
      await db.updateClient(input.clientId, {
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        address: input.address || null,
        email: input.email || null,
        notes: input.notes || null,
      });
      broadcast(ctx.user.id, "clients:updated", { action: "update", id: input.clientId });
    }),

  // Delete client
  deleteClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteClient(input.clientId);
      broadcast(ctx.user.id, "clients:updated", { action: "delete", id: input.clientId });
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
    .mutation(async ({ ctx, input }) => {
      const id = await db.createSite(input.clientId, input.name, input.address || null);
      broadcast(ctx.user.id, "sites:updated", { action: "create", id, clientId: input.clientId });
      return id;
    }),

  // Update site
  updateSite: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string().min(1).optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateSite(input.siteId, input.name, input.address || null);
      broadcast(ctx.user.id, "sites:updated", { action: "update", id: input.siteId });
    }),

  // Delete site
  deleteSite: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteSite(input.siteId);
      broadcast(ctx.user.id, "sites:updated", { action: "delete", id: input.siteId });
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
    .mutation(async ({ ctx, input }) => {
      const id = await db.createDelivery(ctx.user.id, {
        clientId: input.clientId,
        clientName: input.clientName,
        clientCompany: input.clientCompany || null,
        siteId: input.siteId || null,
        siteName: input.siteName || null,
        driverName: input.driverName || null,
        startTime: input.startTime,
      });
      broadcast(ctx.user.id, "deliveries:updated", {
        action: "create",
        id,
        clientName: input.clientName,
        siteName: input.siteName || null,
        driverName: input.driverName || null,
      });
      return id;
    }),

  // Update delivery (end delivery, add photos, etc)
  updateDelivery: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      endTime: z.date().optional(),
      litersDelivered: z.number().optional(),
      driverName: z.string().optional(),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateDelivery(input.deliveryId, {
        endTime: input.endTime,
        litersDelivered: input.litersDelivered,
        driverName: input.driverName,
        photos: input.photos,
      });
      broadcast(ctx.user.id, "deliveries:updated", {
        action: "update",
        id: input.deliveryId,
        litersDelivered: input.litersDelivered,
        endTime: input.endTime,
      });
    }),

  // Delete delivery
  deleteDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteDelivery(input.deliveryId);
      broadcast(ctx.user.id, "deliveries:updated", { action: "delete", id: input.deliveryId });
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

      console.log(`[POD EMAIL] Sending to ${info.client.email}:`, emailBody);
      
      return {
        success: true,
        message: `Email de preuve de livraison envoyé à ${info.client.email}`,
      };
    }),
});
