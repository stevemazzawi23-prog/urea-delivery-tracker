import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { generateInvoicePDFBuffer } from "./pdf-generator-server";

export const invoicePdfRouter = router({
  generatePDF: publicProcedure
    .input(
      z.object({
        invoiceNumber: z.string(),
        invoiceDate: z.number(),
        clientName: z.string(),
        clientCompany: z.string().optional(),
        clientAddress: z.string().optional(),
        clientEmail: z.string().optional(),
        siteName: z.string(),
        litersDelivered: z.number(),
        serviceFee: z.number(),
        pricePerLiter: z.number(),
        subtotal: z.number(),
        gst: z.number(),
        qst: z.number(),
        total: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const pdfBuffer = await generateInvoicePDFBuffer(input);
        
        // Convert buffer to base64 for transmission
        const base64 = pdfBuffer.toString("base64");
        
        return {
          success: true,
          pdf: base64,
          filename: `facture-${input.invoiceNumber.replace(/\//g, "-")}.pdf`,
        };
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error("Failed to generate PDF");
      }
    }),
});
