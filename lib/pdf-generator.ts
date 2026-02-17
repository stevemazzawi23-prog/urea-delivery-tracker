import * as FileSystem from "expo-file-system/legacy";
import { INVOICE_CONFIG } from "./storage";
import { removeAccents } from "./accent-remover";
import { generateProfessionalInvoiceHTML, type InvoiceData as ProfessionalInvoiceData } from "./professional-invoice-template";
import html2pdf from "html2pdf.js";

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

    // Create a temporary HTML file path
    const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.pdf`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // For web and native platforms, we need to handle PDF generation differently
    // For now, save as HTML which can be converted to PDF by the email client
    // In a real scenario, you'd use a server-side PDF generation service
    
    // Save HTML as file
    const htmlFileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.html`;
    const htmlFilePath = `${FileSystem.cacheDirectory}${htmlFileName}`;
    
    await FileSystem.writeAsStringAsync(htmlFilePath, htmlContent);

    console.log("Invoice HTML generated at:", htmlFilePath);
    return htmlFilePath;
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
