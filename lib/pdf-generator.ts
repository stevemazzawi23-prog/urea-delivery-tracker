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

export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  try {
    // Generate simplified HTML content (without logo)
    const htmlContent = generateSimplifiedInvoiceHTML(data);

    // Create filename with .pdf extension
    const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.pdf`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // For now, save as HTML but with PDF intention
    // Client-side will convert to PDF using html2pdf
    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    console.log("Invoice PDF generated at:", filePath);
    return filePath;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

export async function openInvoicePDF(filePath: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, use html2pdf to convert and download
      const htmlContent = await fetch(filePath).then(r => r.text());
      
      // Dynamically load html2pdf
      const html2pdf = (window as any).html2pdf;
      if (html2pdf) {
        const element = document.createElement("div");
        element.innerHTML = htmlContent;
        
        html2pdf().set({
          margin: 10,
          filename: `facture-${new Date().getTime()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        }).save();
      } else {
        // Fallback: open as data URI
        const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        window.open(dataUri, "_blank");
      }
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
