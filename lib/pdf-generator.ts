import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { INVOICE_CONFIG } from "./storage";
import { removeAccents } from "./accent-remover";
import { generateSimplifiedInvoiceHTML } from "./simplified-invoice-template";

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
 * Generate invoice PDF using server-side generation
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  try {
    if (Platform.OS === "web") {
      // For web, call server API to generate PDF
      const response = await fetch("/api/trpc/invoicePdfServer.generatePDF", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF from server");
      }

      const result = await response.json();
      
      if (result.result?.data?.pdf) {
        // Convert base64 to blob
        const binaryString = atob(result.result.data.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Keep URL for opening
        return url;
      } else {
        throw new Error("Invalid response from server");
      }
    } else {
      // For mobile, generate HTML and save
      const htmlContent = generateSimplifiedInvoiceHTML(data);
      const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.html`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, htmlContent);
      return filePath;
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

/**
 * Open invoice PDF
 */
export async function openInvoicePDF(filePath: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, open the PDF in a new tab
      window.open(filePath, "_blank");
    } else {
      // For mobile, open in browser
      await WebBrowser.openBrowserAsync(`file://${filePath}`);
    }
  } catch (error) {
    console.error("Error opening invoice:", error);
    throw error;
  }
}

/**
 * Download invoice PDF
 */
export async function downloadInvoicePDF(invoiceNumber: string): Promise<void> {
  console.log("Download invoice:", invoiceNumber);
}

/**
 * Share invoice PDF
 */
export async function shareInvoicePDF(filePath: string): Promise<void> {
  console.log("Share invoice:", filePath);
}
