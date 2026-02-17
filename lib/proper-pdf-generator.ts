import { removeAccents } from "./accent-remover";

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
 * Generate a proper PDF invoice using jsPDF and html2canvas
 */
export async function generateProperInvoicePDF(data: InvoiceData): Promise<Blob> {
  try {
    // Dynamically import jsPDF and html2canvas
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    // Create HTML element for the invoice
    const invoiceHTML = generateInvoiceHTML(data);
    const element = document.createElement("div");
    element.innerHTML = invoiceHTML;
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.width = "210mm";
    element.style.backgroundColor = "white";
    document.body.appendChild(element);

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create PDF from canvas
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit page
    const imgWidth = pdfWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    // Add image to PDF, creating new pages if needed
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Remove temporary element
    document.body.removeChild(element);

    // Return PDF as blob
    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Generate invoice HTML for PDF rendering
 */
function generateInvoiceHTML(data: InvoiceData): string {
  const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const invoiceDate = dateFormatter.format(new Date(data.invoiceDate));

  return `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; background: white; padding: 40px;">
  <div style="max-width: 800px; margin: 0 auto;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); color: white; padding: 30px; margin-bottom: 30px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 28px; margin: 0 0 5px 0; font-weight: bold;">SP LOGISTIX</h1>
        <p style="font-size: 12px; margin: 0 0 3px 0; opacity: 0.95;">${removeAccents("Livraison d'uree professionnelle")}</p>
        <p style="font-size: 11px; margin: 8px 0 0 0; opacity: 0.95;">
          ${removeAccents("Telephone")}: (514) 555-0123<br>
          Email: info@splogistix.com<br>
          Web: www.splogistix.com
        </p>
      </div>
      <div style="text-align: right;">
        <h2 style="font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">FACTURE</h2>
        <div style="font-size: 12px;">
          <div><strong>No:</strong> ${removeAccents(data.invoiceNumber)}</div>
          <div><strong>Date:</strong> ${invoiceDate}</div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 30px;">
      <!-- Client Info -->
      <div style="display: flex; gap: 40px; margin-bottom: 20px;">
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: bold; color: #1b5e20; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #c8e6c9;">${removeAccents("Facturation a")}</div>
          <div style="font-size: 16px; font-weight: bold; color: #1b5e20; margin-bottom: 5px;">${removeAccents(data.clientName)}</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 5px;">${removeAccents(data.clientCompany || "")}</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 5px;">${removeAccents(data.clientAddress || "")}</div>
          <div style="font-size: 13px; color: #2a5298; font-weight: 500; margin-top: 8px;">${removeAccents(data.clientEmail || "")}</div>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: bold; color: #1b5e20; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #c8e6c9;">${removeAccents("Details de livraison")}</div>
          <div><strong>Site:</strong> ${removeAccents(data.siteName)}</div>
          <div style="margin-top: 8px;"><strong>${removeAccents("Quantite")}:</strong> ${data.litersDelivered} litres</div>
          <div style="margin-top: 8px;"><strong>Date:</strong> ${invoiceDate}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background: #e8f5e9; border-top: 2px solid #1b5e20; border-bottom: 2px solid #1b5e20;">
            <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: bold; color: #1b5e20; text-transform: uppercase;">${removeAccents("Description")}</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: bold; color: #1b5e20; text-transform: uppercase;">${removeAccents("Quantite")}</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: bold; color: #1b5e20; text-transform: uppercase;">${removeAccents("Prix unitaire")}</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: bold; color: #1b5e20; text-transform: uppercase;">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e8e8e8;">
            <td style="padding: 10px; font-size: 12px;">${removeAccents("Frais de service")}</td>
            <td style="padding: 10px; font-size: 12px; text-align: right;">1</td>
            <td style="padding: 10px; font-size: 12px; text-align: right;">$${data.serviceFee.toFixed(2)}</td>
            <td style="padding: 10px; font-size: 12px; text-align: right;">$${data.serviceFee.toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 2px solid #1b5e20;">
            <td style="padding: 10px; font-size: 12px;">${removeAccents("Livraison d'uree")} - ${removeAccents(data.siteName)}</td>
            <td style="padding: 10px; font-size: 12px; text-align: right;">${data.litersDelivered} L</td>
            <td style="padding: 10px; font-size: 12px; text-align: right;">$${data.pricePerLiter.toFixed(2)}/L</td>
            <td style="padding: 10px; font-size: 12px; text-align: right;">$${(data.litersDelivered * data.pricePerLiter).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin: 20px 0;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; border-bottom: 1px solid #e0e0e0; margin-top: 10px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
            <span style="color: #666;">${removeAccents("Sous-total")}:</span>
            <span style="font-weight: 600;">$${data.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; border-bottom: 1px solid #e0e0e0;">
            <span style="color: #666;">TPS (5%):</span>
            <span style="font-weight: 600;">$${data.gst.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; border-bottom: 1px solid #e0e0e0;">
            <span style="color: #666;">TVQ (9.975%):</span>
            <span style="font-weight: 600;">$${data.qst.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px; margin: 10px -12px 0 -12px; background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); color: white; font-weight: bold; border: none;">
            <span>TOTAL A PAYER:</span>
            <span>$${data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div style="background: #e8f5e9; padding: 12px; border-left: 4px solid #2e7d32; margin: 20px 0; font-size: 11px; color: #1b5e20;">
        <strong>${removeAccents("Conditions de paiement")}:</strong> ${removeAccents("Paiement a la livraison ou selon entente. Merci de votre confiance et de votre affaires!")}
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 2px solid #e0e0e0; padding-top: 15px; margin-top: 30px; font-size: 10px; color: #999; display: flex; justify-content: space-between;">
      <div>
        <div style="margin-bottom: 2px;">${removeAccents("Merci de votre confiance!")}</div>
        <div style="font-weight: bold; color: #1b5e20; margin-bottom: 3px;">SP LOGISTIX</div>
        <div style="margin-bottom: 2px;">${removeAccents("© 2026 - Tous droits reserves")}</div>
      </div>
      <div style="text-align: right;">
        <div style="margin-bottom: 2px;">${removeAccents("Numero de facture")}: ${removeAccents(data.invoiceNumber)}</div>
        <div>Date: ${invoiceDate}</div>
      </div>
    </div>
  </div>
</div>
  `;
}
