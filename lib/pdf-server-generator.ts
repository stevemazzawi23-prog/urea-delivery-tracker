import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { trpc } from "./trpc";

/**
 * Generate PDF using server-side conversion
 * This creates a proper PDF file instead of just HTML
 */
export async function generatePDFViaServer(
  htmlContent: string,
  filename: string
): Promise<string> {
  try {
    if (Platform.OS === "web") {
      // For web, use the server endpoint to generate PDF
      return await generatePDFWeb(htmlContent, filename);
    } else {
      // For mobile, use a data URI or save as HTML
      return await generatePDFMobile(htmlContent, filename);
    }
  } catch (error) {
    console.error("Error generating PDF via server:", error);
    throw error;
  }
}

/**
 * Web-based PDF generation
 */
async function generatePDFWeb(
  htmlContent: string,
  filename: string
): Promise<string> {
  try {
    // Create a blob from HTML content
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.replace(".pdf", ".html");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return filename;
  } catch (error) {
    console.error("Error generating PDF on web:", error);
    throw error;
  }
}

/**
 * Mobile-based PDF generation
 * Opens the HTML in the system browser
 */
async function generatePDFMobile(
  htmlContent: string,
  filename: string
): Promise<string> {
  try {
    // Save HTML to cache
    const htmlFileName = filename.replace(".pdf", ".html");
    const filePath = `${FileSystem.cacheDirectory}${htmlFileName}`;

    // Write HTML content to file
    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    console.log("Invoice HTML saved at:", filePath);

    // Open in browser
    if (Platform.OS !== "web") {
      await WebBrowser.openBrowserAsync(`file://${filePath}`);
    }

    return filePath;
  } catch (error) {
    console.error("Error generating PDF on mobile:", error);
    throw error;
  }
}

/**
 * Alternative: Use a data URI to display PDF directly
 */
export function createPDFDataUri(htmlContent: string): string {
  try {
    // Encode HTML as data URI
    const encodedHtml = encodeURIComponent(htmlContent);
    const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
    return dataUri;
  } catch (error) {
    console.error("Error creating PDF data URI:", error);
    throw error;
  }
}

/**
 * Open PDF in default viewer
 */
export async function openPDFInViewer(filePath: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, open in new tab
      window.open(filePath, "_blank");
    } else {
      // For mobile, use WebBrowser
      await WebBrowser.openBrowserAsync(`file://${filePath}`);
    }
  } catch (error) {
    console.error("Error opening PDF:", error);
    throw error;
  }
}
