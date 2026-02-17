import * as FileSystem from "expo-file-system/legacy";
import { INVOICE_CONFIG } from "./storage";
import { removeAccents } from "./accent-remover";
import { generateProfessionalInvoiceHTML, type InvoiceData as ProfessionalInvoiceData } from "./professional-invoice-template";
import { generatePDFFromHTML } from "./pdf-client-generator";

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

export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  try {
    // Generate professional HTML content
    const htmlContent = generateProfessionalInvoiceHTML(data);

    // Create filename
    const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.pdf`;

    // Use client-side PDF generation
    const pdfPath = await generatePDFFromHTML(htmlContent, fileName);

    console.log("Invoice PDF generated at:", pdfPath);
    return pdfPath;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

export async function downloadInvoicePDF(invoiceNumber: string): Promise<void> {
  // This function would handle downloading the PDF
  console.log("Download invoice:", invoiceNumber);
}

export async function generateDeliveryReceiptPDF(data: any): Promise<string> {
  // Placeholder for delivery receipt generation
  return "";
}
