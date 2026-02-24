import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

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
    .mutation(({ ctx, input }) => {
      return db.createInvoice(ctx.user.id, {
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
    }),

  // Update invoice status
  updateStatus: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      status: z.enum(["draft", "sent", "paid"]),
    }))
    .mutation(({ input }) => {
      return db.updateInvoiceStatus(input.invoiceId, input.status);
    }),

  // Delete invoice
  deleteInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(({ input }) => {
      return db.deleteInvoice(input.invoiceId);
    }),
});
