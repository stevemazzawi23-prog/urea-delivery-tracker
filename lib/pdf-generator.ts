import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
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
    // Generate professional HTML content
    const htmlContent = generateProfessionalInvoiceHTML(data);

    // Create filename
    const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.html`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Save HTML to file
    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    console.log("Invoice HTML generated at:", filePath);
    return filePath;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

export async function openInvoicePDF(filePath: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, open in new tab
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
