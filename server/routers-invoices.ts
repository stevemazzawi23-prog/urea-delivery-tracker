import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { io } from "./_core/index";

// Shared company userId: all drivers and admin share the same data pool
const SHARED_COMPANY_USER_ID = 1;

function broadcast(event: string, data: unknown) {
  if (io) {
    io.to(`user:${SHARED_COMPANY_USER_ID}`).emit(event, data);
    console.log(`[Socket.io] Broadcast "${event}" to shared company room`);
  }
}

export const invoicesRouter = router({
  // Get all invoices (shared across all company users)
  listInvoices: protectedProcedure.query(() => {
    return db.getInvoicesByUser(SHARED_COMPANY_USER_ID);
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
    .mutation(async ({ input }) => {
      const id = await db.createInvoice(SHARED_COMPANY_USER_ID, {
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
      broadcast("invoices:updated", { action: "create", id });
      return id;
    }),

  // Update invoice status
  updateStatus: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      status: z.enum(["draft", "sent", "paid"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateInvoiceStatus(input.invoiceId, input.status);
      broadcast("invoices:updated", { action: "update", id: input.invoiceId, status: input.status });
    }),

  // Delete invoice
  deleteInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteInvoice(input.invoiceId);
      broadcast("invoices:updated", { action: "delete", id: input.invoiceId });
    }),
});
