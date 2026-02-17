import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for html2pdf
let html2pdf: any;

async function getHtml2Pdf() {
  if (!html2pdf) {
    try {
      html2pdf = (await import("html2pdf.js")).default;
    } catch (error) {
      console.error("Failed to load html2pdf:", error);
      throw new Error("PDF generation library not available");
    }
  }
  return html2pdf;
}

export const pdfRouter = router({
  // Generate PDF from HTML content
  generateFromHTML: publicProcedure
    .input(
      z.object({
        html: z.string().min(1, "HTML content required"),
        filename: z.string().default("document.pdf"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // For server-side PDF generation, we use a different approach
        // Since html2pdf.js is primarily a browser library, we'll use a server-side solution

        // Option 1: Use puppeteer (if available)
        // Option 2: Use a third-party API like html2pdf.com or similar
        // For now, we'll return the HTML content and let the client handle it

        // In production, you would integrate with:
        // - Puppeteer (for Node.js)
        // - wkhtmltopdf
        // - Or a third-party service like html2pdf.com, CloudConvert, etc.

        console.log("PDF generation requested for:", input.filename);

        // Return success with base64 encoded placeholder
        // In production, this would return the actual PDF buffer
        return {
          success: true,
          message: "PDF generation endpoint ready",
          filename: input.filename,
          // In production, return: data: Buffer (base64 encoded PDF)
        };
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error("Failed to generate PDF");
      }
    }),

  // Alternative: Use a third-party API
  generateFromHTMLViaAPI: publicProcedure
    .input(
      z.object({
        html: z.string().min(1, "HTML content required"),
        filename: z.string().default("document.pdf"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Example using a free HTML to PDF API
        // You can use services like:
        // - html2pdf.com API
        // - CloudConvert API
        // - Convertio API
        // - Or deploy your own Puppeteer service

        // For this implementation, we'll create a simple endpoint
        // that can be called from the client

        console.log("PDF generation via API requested for:", input.filename);

        return {
          success: true,
          message: "Use client-side PDF generation or external API",
          filename: input.filename,
        };
      } catch (error) {
        console.error("Error with PDF API:", error);
        throw new Error("Failed to generate PDF via API");
      }
    }),
});

export type PDFRouter = typeof pdfRouter;
