import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { INVOICE_CONFIG } from "./storage";
import { removeAccents } from "./accent-remover";
import { generateSimplifiedInvoiceHTML } from "./simplified-invoice-template";
import { generateSimplePDFInvoice } from "./simple-pdf-generator";

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
    if (Platform.OS === "web") {
      // For web, use html2pdf to generate PDF
      await generateSimplePDFInvoice(data);
      return "pdf-generated";
    } else {
      // For mobile, generate HTML and save
      const htmlContent = generateSimplifiedInvoiceHTML(data);
      const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.pdf`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, htmlContent);
      return filePath;
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

export async function openInvoicePDF(filePath: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, the PDF is already downloaded by generateInvoicePDF
      // Just open it in a new tab if needed
      window.open(filePath, "_blank");
    } else {
      // For mobile, use WebBrowser
      await WebBrowser.openBrowserAsync(`file://${filePath}`);
    }
  } catch (error) {
    console.error("Error opening invoice:", error);
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
