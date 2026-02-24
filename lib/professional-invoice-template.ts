import { removeAccents } from "./accent-remover";
import { LOGO_SVG } from "./logo-config";

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

export function generateProfessionalInvoiceHTML(data: InvoiceData): string {
  const date = new Date(data.invoiceDate);
  const dateStr = date.toLocaleDateString("fr-CA");

  // Remove accents from all text fields
  const clientName = removeAccents(data.clientName);
  const clientCompany = data.clientCompany ? removeAccents(data.clientCompany) : "";
  const clientAddress = data.clientAddress ? removeAccents(data.clientAddress) : "";
  const clientEmail = data.clientEmail ? removeAccents(data.clientEmail) : "";
  const siteName = removeAccents(data.siteName);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #f8f9fa;
    }
    
    .invoice-container {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    }
    
    /* Header Section */
    .header {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
      color: white;
      padding: 40px 50px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 5px solid #558b2f;
      gap: 30px;
    }
    
    .logo-section {
      flex-shrink: 0;
    }
    
    .logo-section svg {
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    .company-info h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
      letter-spacing: 1px;
      color: #ffffff;
    }
    
    .company-info p {
      font-size: 14px;
      opacity: 0.95;
      margin-bottom: 3px;
    }
    
    .invoice-title-section {
      text-align: right;
    }
    
    .invoice-title-section h2 {
      font-size: 48px;
      font-weight: 300;
      margin-bottom: 10px;
      letter-spacing: 2px;
    }
    
    .invoice-meta {
      font-size: 13px;
      line-height: 1.8;
      opacity: 0.9;
    }
    
    .invoice-meta strong {
      font-weight: 600;
    }
    
    /* Main Content */
    .content {
      flex: 1;
      padding: 40px 50px;
      display: flex;
      flex-direction: column;
    }
    
    .row {
      display: flex;
      gap: 60px;
      margin-bottom: 40px;
    }
    
    .column {
      flex: 1;
    }
    
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #1b5e20;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #c8e6c9;
    }
    
    .client-info {
      font-size: 14px;
      line-height: 1.8;
      color: #333;
    }
    
    .client-name {
      font-size: 16px;
      font-weight: 700;
      color: #1b5e20;
      margin-bottom: 5px;
    }
    
    .client-detail {
      color: #666;
      font-size: 13px;
    }
    
    .client-email {
      color: #2a5298;
      font-weight: 500;
      margin-top: 8px;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    thead {
      background: #e8f5e9;
      border-top: 2px solid #1b5e20;
      border-bottom: 2px solid #1b5e20;
    }
    
    th {
      padding: 12px 15px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #1b5e20;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    th.text-right {
      text-align: right;
    }
    
    td {
      padding: 14px 15px;
      font-size: 13px;
      color: #333;
      border-bottom: 1px solid #e8e8e8;
    }
    
    td.text-right {
      text-align: right;
    }
    
    tbody tr:last-child td {
      border-bottom: 2px solid #1b5e20;
    }
    
    /* Totals Section */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .totals-box {
      width: 300px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 13px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .total-row.subtotal {
      margin-top: 10px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    }
    
    .total-row.final {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
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
    
    /* Notes Section */
    .notes-section {
      background: #e8f5e9;
      padding: 15px;
      border-left: 4px solid #2e7d32;
      margin-bottom: 20px;
      font-size: 12px;
      color: #1b5e20;
      line-height: 1.6;
    }
    
    /* Footer */
    .footer {
      border-top: 2px solid #e0e0e0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #999;
    }
    
    .footer-left {
      flex: 1;
    }
    
    .footer-right {
      text-align: right;
    }
    
    .footer-company {
      font-weight: 600;
      color: #1b5e20;
      margin-bottom: 3px;
    }
    
    .footer-text {
      margin-bottom: 2px;
    }
    
    .payment-status {
      display: inline-block;
      background: #2e7d32;
      color: white;
      padding: 4px 10px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 5px;
    }
    
    @media print {
      body {
        background: white;
      }
      .invoice-container {
        box-shadow: none;
        margin: 0;
        width: 100%;
        height: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${LOGO_SVG}
      </div>
      <div class="company-info">
        <h1>SP LOGISTIX</h1>
        <p>Livraison d'uree professionnelle</p>
        <p style="margin-top: 10px; font-size: 12px;">
          Telephone: (514) 555-0123<br>
          Email: info@splogistix.com<br>
          Web: www.splogistix.com
        </p>
      </div>
      <div class="invoice-title-section">
        <h2>FACTURE</h2>
        <div class="invoice-meta">
          <div><strong>No:</strong> ${data.invoiceNumber}</div>
          <div><strong>Date:</strong> ${dateStr}</div>
          <div style="margin-top: 8px;">
            <div class="payment-status">PAYEE</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Client Information -->
      <div class="row">
        <div class="column">
          <div class="section-title">Facturation a</div>
          <div class="client-info">
            <div class="client-name">${clientName}</div>
            ${clientCompany ? `<div class="client-detail">${clientCompany}</div>` : ""}
            ${clientAddress ? `<div class="client-detail">${clientAddress}</div>` : ""}
            ${clientEmail ? `<div class="client-email">${clientEmail}</div>` : ""}
          </div>
        </div>
        <div class="column">
          <div class="section-title">Details de livraison</div>
          <div class="client-info">
            <div><strong>Site:</strong> ${siteName}</div>
            <div style="margin-top: 8px;"><strong>Quantite:</strong> ${data.litersDelivered} litres</div>
            <div style="margin-top: 8px;"><strong>Date:</strong> ${dateStr}</div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="items-section">
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
              <td class="text-right">$${data.serviceFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Livraison d'uree - ${siteName}</td>
              <td class="text-right">${data.litersDelivered} L</td>
              <td class="text-right">$${data.pricePerLiter.toFixed(2)}/L</td>
              <td class="text-right">$${(data.litersDelivered * data.pricePerLiter).toFixed(2)}</td>
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

      <!-- Notes -->
      <div class="notes-section">
        <strong>Conditions de paiement:</strong> Paiement a la livraison ou selon entente. Merci de votre confiance et de votre affaires!
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <div class="footer-text">Merci de votre confiance!</div>
        <div class="footer-company">SP LOGISTIX</div>
        <div class="footer-text">© 2026 - Tous droits reserves</div>
      </div>
      <div class="footer-right">
        <div class="footer-text">Numero de facture: ${data.invoiceNumber}</div>
        <div class="footer-text">Date: ${dateStr}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
