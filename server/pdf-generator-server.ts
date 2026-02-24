import PDFDocument from "pdfkit";
// @ts-ignore
import { removeAccents } from "../lib/accent-remover";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: number;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  clientEmail?: string;
  siteName: string;
  litersDelivered: number;
  serviceFee: number;
  pricePerLiter: number;
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
}

/**
 * Generate a PDF invoice using PDFKit
 * Returns a Buffer containing the PDF data
 */
export async function generateInvoicePDFBuffer(
  data: InvoiceData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Format date
      const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const invoiceDate = dateFormatter.format(new Date(data.invoiceDate));

      // Header with green background
      doc
        .rect(0, 0, doc.page.width, 120)
        .fill("#1b5e20");

      // Company name
      doc
        .fontSize(28)
        .font("Helvetica-Bold")
        .fillColor("white")
        .text("SP LOGISTIX", 50, 20);

      // Company info
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("white")
        .text(removeAccents("Livraison d'uree professionnelle"), 50, 50);

      doc
        .fontSize(10)
        .fillColor("white")
        .text(removeAccents("Telephone") + ": (514) 555-0123", 50, 65);

      doc.text("Email: info@splogistix.com", 50, 78);
      doc.text("Web: www.splogistix.com", 50, 91);

      // Invoice number and date on the right
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("white")
        .text("FACTURE", doc.page.width - 200, 20);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("white")
        .text("No: " + removeAccents(data.invoiceNumber), doc.page.width - 200, 50);

      doc.text("Date: " + invoiceDate, doc.page.width - 200, 65);

      // Reset fill color
      doc.fillColor("#333");

      // Billing section
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#1b5e20")
        .text(removeAccents("Facturation a"), 50, 150);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1b5e20")
        .text(removeAccents(data.clientName), 50, 170);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333")
        .text(removeAccents(data.clientCompany || ""), 50, 190);

      doc.text(removeAccents(data.clientAddress || ""), 50, 205);

      // Delivery details
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#1b5e20")
        .text(removeAccents("Details de livraison"), 350, 150);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333")
        .text("Site: " + removeAccents(data.siteName), 350, 170);

      doc.text(removeAccents("Quantite") + ": " + data.litersDelivered + " litres", 350, 190);
      doc.text("Date: " + invoiceDate, 350, 210);

      // Items table
      const tableTop = 280;
      const col1 = 50;
      const col2 = 350;
      const col3 = 450;
      const col4 = 550;

      // Table header
      doc
        .rect(col1 - 10, tableTop - 5, doc.page.width - 100, 25)
        .fill("#e8f5e9");

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#1b5e20")
        .text(removeAccents("Description"), col1, tableTop);

      doc.text(removeAccents("Quantite"), col2, tableTop);
      doc.text(removeAccents("Prix unitaire"), col3, tableTop);
      doc.text("Montant", col4, tableTop);

      // Table rows
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333");

      let rowY = tableTop + 35;

      // Service fee row
      doc.text(removeAccents("Frais de service"), col1, rowY);
      doc.text("1", col2, rowY);
      doc.text("$" + data.serviceFee.toFixed(2), col3, rowY);
      doc.text("$" + data.serviceFee.toFixed(2), col4, rowY);

      rowY += 25;

      // Delivery row
      doc.text(removeAccents("Livraison d'uree") + " - " + removeAccents(data.siteName), col1, rowY);
      doc.text(data.litersDelivered + " L", col2, rowY);
      doc.text("$" + data.pricePerLiter.toFixed(2) + "/L", col3, rowY);
      doc.text("$" + (data.litersDelivered * data.pricePerLiter).toFixed(2), col4, rowY);

      // Totals section
      rowY += 50;

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333");

      doc.text(removeAccents("Sous-total") + ":", col3, rowY);
      doc.text("$" + data.subtotal.toFixed(2), col4, rowY);

      rowY += 20;
      doc.text("TPS (5%):", col3, rowY);
      doc.text("$" + data.gst.toFixed(2), col4, rowY);

      rowY += 20;
      doc.text("TVQ (9.975%):", col3, rowY);
      doc.text("$" + data.qst.toFixed(2), col4, rowY);

      // Total box
      rowY += 30;
      doc
        .rect(col3 - 10, rowY - 10, 220, 30)
        .fill("#1b5e20");

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("white")
        .text("TOTAL A PAYER:", col3, rowY);

      doc.text("$" + data.total.toFixed(2), col4, rowY);

      // Notes section
      rowY += 60;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#1b5e20");

      doc.text(removeAccents("Conditions de paiement") + ":", 50, rowY);
      doc
        .fontSize(9)
        .fillColor("#333")
        .text(
          removeAccents(
            "Paiement a la livraison ou selon entente. Merci de votre confiance et de votre affaires!"
          ),
          50,
          rowY + 20,
          { width: 500 }
        );

      // Footer
      doc
        .fontSize(9)
        .fillColor("#999")
        .text(removeAccents("Merci de votre confiance!"), 50, doc.page.height - 60);

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#1b5e20")
        .text("SP LOGISTIX", 50, doc.page.height - 45);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#999")
        .text(removeAccents("© 2026 - Tous droits reserves"), 50, doc.page.height - 30);

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
