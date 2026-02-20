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

    // Remove accents from all text fields for PDF compatibility
    const clientName = removeAccents(data.clientName);
    const clientCompany = data.clientCompany ? removeAccents(data.clientCompany) : "";
    const clientAddress = data.clientAddress ? removeAccents(data.clientAddress) : "";
    const clientEmail = data.clientEmail ? removeAccents(data.clientEmail) : "";
    const siteName = removeAccents(data.siteName);

    // Create professional HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #fff;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      background-color: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      border-bottom: 3px solid #2E7D32;
      padding-bottom: 30px;
    }
    .company-header {
      flex: 1;
    }
    .company-name {
      font-size: 28px;
      font-weight: 700;
      color: #2E7D32;
      margin-bottom: 5px;
    }
    .company-tagline {
      font-size: 14px;
      color: #666;
      margin-bottom: 15px;
    }
    .company-contact {
      font-size: 12px;
      color: #999;
      line-height: 1.8;
    }
    .invoice-header {
      text-align: right;
    }
    .invoice-title {
      font-size: 36px;
      font-weight: 700;
      color: #2E7D32;
      margin-bottom: 10px;
    }
    .invoice-meta {
      font-size: 13px;
      color: #666;
      line-height: 1.8;
    }
    .invoice-meta strong {
      color: #333;
    }
    .content {
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #2E7D32;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .client-info {
      font-size: 14px;
      line-height: 1.8;
    }
    .client-name {
      font-size: 16px;
      font-weight: 700;
      color: #333;
      margin-bottom: 5px;
    }
    .client-detail {
      color: #666;
      margin-bottom: 3px;
    }
    .client-email {
      color: #2E7D32;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #F5F5F5;
      padding: 15px;
      text-align: left;
      font-weight: 700;
      font-size: 13px;
      color: #2E7D32;
      border-bottom: 2px solid #2E7D32;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-box {
      width: 350px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 14px;
      border-bottom: 1px solid #eee;
    }
    .total-row.subtotal {
      margin-top: 10px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    .total-row.final {
      background-color: #2E7D32;
      color: white;
      padding: 15px;
      margin: 15px -15px 0 -15px;
      font-size: 16px;
      font-weight: 700;
      border: none;
    }
    .total-label {
      color: #666;
      font-weight: 500;
    }
    .total-amount {
      font-weight: 600;
      color: #333;
    }
    .final-label {
      color: white !important;
    }
    .final-amount {
      color: white !important;
    }
    .notes-section {
      background-color: #F9F9F9;
      padding: 20px;
      border-left: 4px solid #2E7D32;
      margin-bottom: 30px;
    }
    .notes-title {
      font-size: 12px;
      font-weight: 700;
      color: #2E7D32;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .notes-text {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 12px;
      line-height: 1.8;
    }
    .footer-divider {
      margin: 15px 0;
      color: #ddd;
    }
    .payment-terms {
      background-color: #FFFACD;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 30px;
      font-size: 13px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-header">
        <div class="company-name">SP LOGISTIX</div>
        <div class="company-tagline">Bureau de MTL</div>
        <div class="company-contact">
          <div>Telephone: (514) 555-0123</div>
          <div>Email: Logistixsp@gmail.com</div>
        </div>
      </div>
      <div class="invoice-header">
        <div class="invoice-title">FACTURE</div>
        <div class="invoice-meta">
          <div><strong>No:</strong> ${data.invoiceNumber}</div>
          <div><strong>Date:</strong> ${dateStr}</div>

        </div>
      </div>
    </div>

    <!-- Client Information -->
    <div class="section">
      <div class="section-title">Facturation a</div>
      <div class="client-info">
        <div class="client-name">${clientName}</div>
        ${clientCompany ? `<div class="client-detail">${clientCompany}</div>` : ""}
        ${clientAddress ? `<div class="client-detail">${clientAddress}</div>` : ""}
        ${clientEmail ? `<div class="client-email">${clientEmail}</div>` : ""}
      </div>
    </div>

    <!-- Delivery Details -->
    <div class="section">
      <div class="section-title">Details de livraison</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Quantite</th>
            <th class="text-right">Prix unitaire</th>
            <th class="text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Frais de service</td>
            <td class="text-right">1</td>
            <td class="text-right">$${data.serviceFee.toFixed(2)}</td>
            <td class="text-right"><strong>$${data.serviceFee.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td>Livraison d'uree - ${siteName} - ${dateStr}</td>
            <td class="text-right">${data.litersDelivered} L</td>
            <td class="text-right">$${data.pricePerLiter.toFixed(2)}/L</td>
            <td class="text-right"><strong>$${(data.litersDelivered * data.pricePerLiter).toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row subtotal">
          <span class="total-label">Sous-total:</span>
          <span class="total-amount">$${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">TPS (5%):</span>
          <span class="total-amount">$${data.gst.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">TVQ (9.975%):</span>
          <span class="total-amount">$${data.qst.toFixed(2)}</span>
        </div>
        <div class="total-row final">
          <span class="final-label">TOTAL A PAYER:</span>
          <span class="final-amount">$${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Terms -->
    <div class="payment-terms">
      <strong>Conditions de paiement:</strong> Paiement sous les 15 jours. Merci de votre confiance!
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Merci de votre confiance et de votre affaires!</div>
      <div class="footer-divider">---</div>
      <div>SP LOGISTIX | Bureau de MTL</div>
      <div>© 2026 - Tous droits reserves</div>
    </div>
  </div>
</body>
</html>
    `;

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
  try {
    // On web, create a blob and trigger download
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Get the invoice HTML from localStorage or generate it
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const invoice = invoices.find((inv: any) => inv.invoiceNumber === invoiceNumber);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create a simple HTML to PDF conversion
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { border-bottom: 2px solid #2E7D32; padding-bottom: 20px; margin-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; color: #2E7D32; }
    .invoice-details { margin: 20px 0; }
    .section { margin: 20px 0; padding: 10px; border-left: 4px solid #2E7D32; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #2E7D32; color: white; }
    .total { font-size: 18px; font-weight: bold; color: #2E7D32; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">SP LOGISTIX</div>
    <div>Livraison d'uree professionnelle</div>
  </div>
  
  <div class="invoice-details">
    <h2>FACTURE</h2>
    <p><strong>Numero:</strong> ${invoice.invoiceNumber}</p>
    <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('fr-CA')}</p>
  </div>
  
  <div class="section">
    <h3>Facturation a</h3>
    <p><strong>${invoice.clientName}</strong></p>
    <p>${invoice.clientCompany || ''}</p>
    <p>${invoice.clientAddress || ''}</p>
    <p>${invoice.clientEmail || ''}</p>
  </div>
  
  <div class="section">
    <h3>Details de livraison</h3>
    <table>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Montant</th>
      </tr>
      <tr>
        <td>Frais de service</td>
        <td style="text-align: right;">$${invoice.serviceFee.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Livraison (${invoice.litersDelivered}L @ $${invoice.pricePerLiter}/L)</td>
        <td style="text-align: right;">$${(invoice.litersDelivered * invoice.pricePerLiter).toFixed(2)}</td>
      </tr>
      <tr style="border-top: 2px solid #2E7D32;">
        <td><strong>Sous-total</strong></td>
        <td style="text-align: right;"><strong>$${invoice.subtotal.toFixed(2)}</strong></td>
      </tr>
      <tr>
        <td>TPS (5%)</td>
        <td style="text-align: right;">$${invoice.gst.toFixed(2)}</td>
      </tr>
      <tr>
        <td>TVQ (9.975%)</td>
        <td style="text-align: right;">$${invoice.qst.toFixed(2)}</td>
      </tr>
      <tr style="background-color: #2E7D32; color: white;">
        <td class="total">TOTAL A PAYER</td>
        <td class="total" style="text-align: right;">$${invoice.total.toFixed(2)}</td>
      </tr>
    </table>
  </div>
  
  <div class="section">
    <h3>Conditions de paiement</h3>
    <p>Le paiement doit etre effectue dans les 15 jours suivant la date de cette facture.</p>
  </div>
  
  <div style="margin-top: 40px; text-align: center; color: #999;">
    <p>Merci de votre confiance!</p>
    <p>SP Logistix</p>
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facture-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

export async function generateDeliveryReceiptPDF(data: any): Promise<string> {
  // Placeholder for delivery receipt generation
  const fileName = `bon-livraison-${Date.now()}.pdf`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  return filePath;
}
