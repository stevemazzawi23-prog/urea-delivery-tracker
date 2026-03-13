import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { io } from "./_core/index";

function broadcast(userId: number, event: string, data: unknown) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`[Socket.io] Broadcast "${event}" to room user:${userId}`);
  }
}

export const invoicesRouter = router({
  // Get all invoices for current user
  listInvoices: protectedProcedure.query(({ ctx }) => {
    return db.getInvoicesByUser(ctx.user.id);
  }),

  // Get invoices for a specific delivery
  listByDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(({ input }) => {
      return db.getInvoicesByDelivery(input.deliveryId);
    }),

  // Get invoice by ID
  getInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(({ input }) => {
      return db.getInvoiceById(input.invoiceId);
    }),

  // Create invoice
  createInvoice: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      clientId: z.number(),
      clientName: z.string(),
      clientEmail: z.string().email().optional(),
      clientAddress: z.string().optional(),
      invoiceNumber: z.string(),
      invoiceDate: z.date(),
      serviceFee: z.number(),
      pricePerLiter: z.number(),
      litersDelivered: z.number(),
      subtotal: z.number(),
      gst: z.number(),
      qst: z.number(),
      total: z.number(),
      status: z.enum(["draft", "sent", "paid"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createInvoice(ctx.user.id, {
        deliveryId: input.deliveryId,
        clientId: input.clientId,
        clientName: input.clientName,
        clientEmail: input.clientEmail || null,
        clientAddress: input.clientAddress || null,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        serviceFee: input.serviceFee,
        pricePerLiter: input.pricePerLiter,
        litersDelivered: input.litersDelivered,
        subtotal: input.subtotal,
        gst: input.gst,
        qst: input.qst,
        total: input.total,
        status: input.status,
      });
      broadcast(ctx.user.id, "invoices:updated", { action: "create", id });
      return id;
    }),

  // Update invoice status
  updateStatus: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      status: z.enum(["draft", "sent", "paid"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateInvoiceStatus(input.invoiceId, input.status);
      broadcast(ctx.user.id, "invoices:updated", { action: "update", id: input.invoiceId, status: input.status });
    }),

  // Delete invoice
  deleteInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteInvoice(input.invoiceId);
      broadcast(ctx.user.id, "invoices:updated", { action: "delete", id: input.invoiceId });
    }),
});
