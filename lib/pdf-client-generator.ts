import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

/**
 * Client-side PDF generation using html2pdf.js
 * This works on web and can be adapted for mobile
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  filename: string
): Promise<string> {
  try {
    if (Platform.OS === "web") {
      // For web, use html2pdf.js library
      return await generatePDFWeb(htmlContent, filename);
    } else {
      // For mobile, save as HTML and return path
      return await generatePDFMobile(htmlContent, filename);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Web-based PDF generation using html2pdf.js
 */
async function generatePDFWeb(
  htmlContent: string,
  filename: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Dynamically import html2pdf for web
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

      script.onload = () => {
        // Create a temporary container
        const element = document.createElement("div");
        element.innerHTML = htmlContent;
        element.style.display = "none";
        document.body.appendChild(element);

        // Generate PDF
        const opt = {
          margin: 10,
          filename: filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        };

        // Use global html2pdf if available
        if ((window as any).html2pdf) {
          (window as any).html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
              document.body.removeChild(element);
              resolve(filename);
            })
            .catch((error: any) => {
              document.body.removeChild(element);
              reject(error);
            });
        } else {
          document.body.removeChild(element);
          reject(new Error("html2pdf not loaded"));
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load html2pdf library"));
      };

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Mobile-based PDF generation (saves as HTML for now)
 * In production, you would integrate with a PDF generation service
 */
async function generatePDFMobile(
  htmlContent: string,
  filename: string
): Promise<string> {
  try {
    const pdfFileName = filename.replace(".pdf", ".html");
    const filePath = `${FileSystem.cacheDirectory}${pdfFileName}`;

    // Save HTML content
    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    console.log("PDF (HTML) generated at:", filePath);
    return filePath;
  } catch (error) {
    console.error("Error generating mobile PDF:", error);
    throw error;
  }
}

/**
 * Convert HTML to PDF using a server-side API
 * This is the recommended approach for production
 */
export async function generatePDFViaAPI(
  htmlContent: string,
  filename: string,
  apiEndpoint: string = "/api/pdf/generate"
): Promise<Blob> {
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    // Return PDF as blob
    return await response.blob();
  } catch (error) {
    console.error("Error generating PDF via API:", error);
    throw error;
  }
}
