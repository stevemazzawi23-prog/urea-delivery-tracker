import * as FileSystem from "expo-file-system/legacy";
import { INVOICE_CONFIG } from "./storage";
import { removeAccents } from "./accent-remover";
import { generateProfessionalInvoiceHTML, type InvoiceData as ProfessionalInvoiceData } from "./professional-invoice-template";

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
    // Use the professional invoice template
    const htmlContent = generateProfessionalInvoiceHTML(data);


    // Save HTML as file for now (will be converted to PDF by email client)
    const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.html`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Write file
    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    console.log("Invoice HTML generated at:", filePath);
    return filePath;
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
  const fileName = `bon-livraison-${Date.now()}.pdf`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  return filePath;
}
