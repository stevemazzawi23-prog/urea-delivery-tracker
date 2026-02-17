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
 * Generate PDF invoice content as HTML that can be converted to PDF
 * This is used server-side with PDFKit or similar
 */
export function generatePDFInvoiceHTML(data: InvoiceData): string {
  const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const invoiceDate = dateFormatter.format(new Date(data.invoiceDate));

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${removeAccents(data.invoiceNumber)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 40px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
      color: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info h1 {
      font-size: 28px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .company-info p {
      font-size: 12px;
      margin-bottom: 3px;
      opacity: 0.95;
    }
    
    .invoice-details {
      text-align: right;
      font-size: 12px;
    }
    
    .invoice-details h2 {
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: normal;
    }
    
    .invoice-details div {
      margin-bottom: 5px;
    }
    
    /* Content */
    .content {
      margin-bottom: 30px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 11px;
      font-weight: bold;
      color: #1b5e20;
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #c8e6c9;
    }
    
    .row {
      display: flex;
      gap: 40px;
      margin-bottom: 20px;
    }
    
    .column {
      flex: 1;
    }
    
    .info-label {
      font-weight: bold;
      color: #1b5e20;
      margin-bottom: 3px;
    }
    
    .info-value {
      font-size: 13px;
      margin-bottom: 5px;
    }
    
    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    thead {
      background: #e8f5e9;
      border-top: 2px solid #1b5e20;
      border-bottom: 2px solid #1b5e20;
    }
    
    th {
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: bold;
      color: #1b5e20;
      text-transform: uppercase;
    }
    
    th.text-right {
      text-align: right;
    }
    
    td {
      padding: 10px;
      font-size: 12px;
      border-bottom: 1px solid #e8e8e8;
    }
    
    td.text-right {
      text-align: right;
    }
    
    tbody tr:last-child td {
      border-bottom: 2px solid #1b5e20;
    }
    
    /* Totals */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin: 20px 0;
    }
    
    .totals-box {
      width: 300px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .total-row.final {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
      color: white;
      padding: 12px;
      margin: 10px -12px 0 -12px;
      font-weight: bold;
      border: none;
    }
    
    .total-label {
      color: #666;
    }
    
    .total-amount {
      font-weight: 600;
    }
    
    .final-label,
    .final-amount {
      color: white !important;
    }
    
    /* Notes */
    .notes {
      background: #e8f5e9;
      padding: 12px;
      border-left: 4px solid #2e7d32;
      margin: 20px 0;
      font-size: 11px;
      color: #1b5e20;
    }
    
    /* Footer */
    .footer {
      border-top: 2px solid #e0e0e0;
      padding-top: 15px;
      margin-top: 30px;
      font-size: 10px;
      color: #999;
      display: flex;
      justify-content: space-between;
    }
    
    .footer-company {
      font-weight: bold;
      color: #1b5e20;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>SP LOGISTIX</h1>
        <p>${removeAccents("Livraison d'uree professionnelle")}</p>
        <p style="margin-top: 8px; font-size: 11px;">
          ${removeAccents("Telephone")}: (514) 555-0123<br>
          Email: info@splogistix.com<br>
          Web: www.splogistix.com
        </p>
      </div>
      <div class="invoice-details">
        <h2>FACTURE</h2>
        <div><strong>No:</strong> ${removeAccents(data.invoiceNumber)}</div>
        <div><strong>Date:</strong> ${invoiceDate}</div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Client Info -->
      <div class="row">
        <div class="column">
          <div class="section-title">${removeAccents("Facturation a")}</div>
          <div class="info-label">${removeAccents(data.clientName)}</div>
          <div class="info-value">${removeAccents(data.clientCompany || "")}</div>
          <div class="info-value">${removeAccents(data.clientAddress || "")}</div>
          <div class="info-value" style="color: #2a5298;">${removeAccents(data.clientEmail || "")}</div>
        </div>
        <div class="column">
          <div class="section-title">${removeAccents("Details de livraison")}</div>
          <div><strong>Site:</strong> ${removeAccents(data.siteName)}</div>
          <div style="margin-top: 8px;"><strong>${removeAccents("Quantite")}:</strong> ${data.litersDelivered} litres</div>
          <div style="margin-top: 8px;"><strong>Date:</strong> ${invoiceDate}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>${removeAccents("Description")}</th>
              <th class="text-right">${removeAccents("Quantite")}</th>
              <th class="text-right">${removeAccents("Prix unitaire")}</th>
              <th class="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${removeAccents("Frais de service")}</td>
              <td class="text-right">1</td>
              <td class="text-right">$${data.serviceFee.toFixed(2)}</td>
              <td class="text-right">$${data.serviceFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td>${removeAccents("Livraison d'uree")} - ${removeAccents(data.siteName)}</td>
              <td class="text-right">${data.litersDelivered} L</td>
              <td class="text-right">$${data.pricePerLiter.toFixed(2)}/L</td>
              <td class="text-right">$${(data.litersDelivered * data.pricePerLiter).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-box">
          <div class="total-row">
            <span class="total-label">${removeAccents("Sous-total")}:</span>
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
      <div class="notes">
        <strong>${removeAccents("Conditions de paiement")}:</strong> ${removeAccents("Paiement a la livraison ou selon entente. Merci de votre confiance et de votre affaires!")}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <div>${removeAccents("Merci de votre confiance!")}</div>
        <div class="footer-company">SP LOGISTIX</div>
        <div>${removeAccents("© 2026 - Tous droits reserves")}</div>
      </div>
      <div style="text-align: right;">
        <div>${removeAccents("Numero de facture")}: ${removeAccents(data.invoiceNumber)}</div>
        <div>Date: ${invoiceDate}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
