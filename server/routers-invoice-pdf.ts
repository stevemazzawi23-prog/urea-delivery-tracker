import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { generatePDFInvoiceHTML } from "../lib/pdfkit-invoice-generator";

export const invoicePdfRouter = router({
  generateInvoiceHtml: publicProcedure
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
    .query(({ input }) => {
      try {
        // Generate HTML content that can be converted to PDF
        const htmlContent = generatePDFInvoiceHTML(input);
        
        return {
          success: true,
          html: htmlContent,
        };
      } catch (error) {
        console.error("Error generating invoice HTML:", error);
        throw new Error("Failed to generate invoice HTML");
      }
    }),
});
