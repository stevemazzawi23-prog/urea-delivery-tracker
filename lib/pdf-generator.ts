import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { INVOICE_CONFIG } from "./storage";
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

export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  try {
    const date = new Date(data.invoiceDate);
    const dateStr = date.toLocaleDateString("fr-CA");

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #fff;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1B5E20;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      width: 120px;
      height: auto;
    }
    .company-info {
      text-align: right;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #1B5E20;
      margin: 0;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #1B5E20;
      margin: 20px 0 10px 0;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
    .invoice-date {
      font-size: 14px;
      color: #666;
      margin: 5px 0 0 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .section-content {
      font-size: 14px;
      line-height: 1.6;
    }
    .client-name {
      font-size: 16px;
      font-weight: bold;
      color: #1B5E20;
      margin-bottom: 5px;
    }
    .divider {
      border-top: 1px solid #ddd;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f5f5f5;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #1B5E20;
      color: #1B5E20;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .amount {
      text-align: right;
    }
    .total-section {
      margin-top: 30px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .total-row.subtotal {
      border-top: 1px solid #ddd;
      padding-top: 15px;
      margin-top: 15px;
    }
    .total-row.final {
      border-top: 2px solid #1B5E20;
      border-bottom: 2px solid #1B5E20;
      padding: 15px 0;
      margin: 15px 0;
      font-size: 18px;
      font-weight: bold;
      color: #1B5E20;
    }
    .label {
      color: #666;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" class="logo" alt="SP Logistix">
      <div class="company-info">
        <p class="company-name">SP Logistix</p>
        <p style="margin: 5px 0; color: #666;">Livraison d'urée</p>
      </div>
    </div>

    <div>
      <h1 class="invoice-title">FACTURE</h1>
      <p class="invoice-number">Numéro: ${data.invoiceNumber}</p>
      <p class="invoice-date">Date: ${dateStr}</p>
    </div>

    <div class="divider"></div>

    <div class="section">
      <p class="section-title">Facturation à:</p>
      <div class="section-content">
        <p class="client-name">${data.clientName}</p>
        ${data.clientCompany ? `<p style="margin: 5px 0; color: #666;">${data.clientCompany}</p>` : ""}
        ${data.clientAddress ? `<p style="margin: 5px 0; color: #666;">${data.clientAddress}</p>` : ""}
        ${data.clientEmail ? `<p style="margin: 5px 0; color: #1B5E20;">${data.clientEmail}</p>` : ""}
      </div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <p class="section-title">Détails de la livraison:</p>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Quantité</th>
            <th class="amount">Prix unitaire</th>
            <th class="amount">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Frais de service</td>
            <td class="amount">1</td>
            <td class="amount">$${data.serviceFee.toFixed(2)}</td>
            <td class="amount">$${data.serviceFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Livraison d'urée - Site: ${data.siteName}</td>
            <td class="amount">${data.litersDelivered} L</td>
            <td class="amount">$${data.pricePerLiter.toFixed(2)}/L</td>
            <td class="amount">$${(data.litersDelivered * data.pricePerLiter).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div class="total-row subtotal">
        <span class="label">Sous-total:</span>
        <span>$${data.subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span class="label">TPS (5%):</span>
        <span>$${data.gst.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span class="label">TVQ (9.975%):</span>
        <span>$${data.qst.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span>TOTAL À PAYER:</span>
        <span>$${data.total.toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Merci de votre confiance!</p>
      <p>SP Logistix - Livraison d'urée</p>
      <p>© 2026 - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
    `;

    // Generate PDF using html2pdf or similar
    // For now, we'll create a text-based PDF
    const fileName = `facture-${data.invoiceNumber.replace(/\//g, "-")}.pdf`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Create PDF content as HTML and convert to PDF
    // Using a simple approach with text content
    const pdfContent = generateSimplePDF(data);

    // Write file
    await FileSystem.writeAsStringAsync(filePath, pdfContent);

    return filePath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

function generateSimplePDF(data: InvoiceData): string {
  // This is a simplified text-based PDF generation
  // In production, you'd use a library like react-native-pdf-lib or similar

  const date = new Date(data.invoiceDate);
  const dateStr = date.toLocaleDateString("fr-CA");
  
  // Remove accents from all text fields for PDF compatibility
  const clientName = removeAccents(data.clientName);
  const clientCompany = data.clientCompany ? removeAccents(data.clientCompany) : "";
  const siteName = removeAccents(data.siteName);

  return `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 2000 >>
stream
BT
/F1 24 Tf
50 700 Td
(FACTURE) Tj
0 -30 Td
/F1 12 Tf
(Numero: ${data.invoiceNumber}) Tj
0 -20 Td
(Date: ${dateStr}) Tj
0 -40 Td
/F1 14 Tf
(FACTURATION A:) Tj
0 -20 Td
/F1 12 Tf
(${clientName}) Tj
0 -15 Td
${clientCompany ? `(${clientCompany}) Tj\n0 -15 Td\n` : ""}
(Details de la livraison:) Tj
0 -20 Td
(Site: ${siteName}) Tj
0 -15 Td
(Quantite livree: ${data.litersDelivered} litres) Tj
0 -40 Td
/F1 14 Tf
(DETAIL DE LA FACTURATION) Tj
0 -20 Td
/F1 12 Tf
(Frais de service: $${data.serviceFee.toFixed(2)}) Tj
0 -15 Td
(Livraison (${data.litersDelivered}L @ $${data.pricePerLiter}/L): $${(data.litersDelivered * data.pricePerLiter).toFixed(2)}) Tj
0 -20 Td
(Sous-total: $${data.subtotal.toFixed(2)}) Tj
0 -15 Td
(TPS (5%): $${data.gst.toFixed(2)}) Tj
0 -15 Td
(TVQ (9.975%): $${data.qst.toFixed(2)}) Tj
0 -20 Td
/F1 14 Tf
(TOTAL A PAYER: $${data.total.toFixed(2)}) Tj
0 -40 Td
/F1 10 Tf
(Merci de votre confiance!) Tj
0 -15 Td
(SP Logistix - Livraison d'uree) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000002264 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2343
%%EOF
  `;
}

export async function downloadInvoicePDF(filePath: string, fileName: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, create a download link
      const content = await FileSystem.readAsStringAsync(filePath);
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${content}`;
      link.download = fileName;
      link.click();
    } else {
      // For mobile, use native share
      const { Share } = require("react-native");
      Share.share({
        url: filePath,
        title: fileName,
        message: `Facture: ${fileName}`,
      });
    }
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}
