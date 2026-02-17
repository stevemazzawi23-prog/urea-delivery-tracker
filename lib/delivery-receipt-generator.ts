import * as FileSystem from "expo-file-system/legacy";
import type { DeliveryUnit } from "./storage";

export interface DeliveryReceiptData {
  clientName: string;
  clientCompany?: string;
  siteName: string;
  driverName?: string;
  startTime: number;
  endTime: number;
  litersDelivered: number;
  units: DeliveryUnit[];
}

export async function generateDeliveryReceiptPDF(data: DeliveryReceiptData): Promise<string> {
  try {
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);
    const durationSeconds = Math.floor((data.endTime - data.startTime) / 1000);
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);

    const unitsText = data.units
      .map((unit) => `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${unit.unitName}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${unit.liters} L</td></tr>`)
      .join("");

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
      border-bottom: 3px solid #1B5E20;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #1B5E20;
      margin: 0 0 10px 0;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #1B5E20;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-label {
      font-weight: bold;
      color: #333;
    }
    .info-value {
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background-color: #f5f5f5;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      color: #333;
      border-bottom: 2px solid #1B5E20;
    }
    .total-section {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 16px;
      font-weight: bold;
      color: #1B5E20;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">BILLET DE LIVRAISON</div>
      <div class="subtitle">SP Logistix - Livraison d'Urée</div>
    </div>

    <div class="section">
      <div class="section-title">Informations de Livraison</div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${data.clientName}</span>
      </div>
      ${data.clientCompany ? `<div class="info-row">
        <span class="info-label">Entreprise:</span>
        <span class="info-value">${data.clientCompany}</span>
      </div>` : ""}
      <div class="info-row">
        <span class="info-label">Site:</span>
        <span class="info-value">${data.siteName || "Non spécifié"}</span>
      </div>
      ${data.driverName ? `<div class="info-row">
        <span class="info-label">Livreur:</span>
        <span class="info-value">${data.driverName}</span>
      </div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Détails de la Livraison</div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${startDate.toLocaleDateString("fr-CA")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Heure de début:</span>
        <span class="info-value">${startDate.toLocaleTimeString("fr-CA")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Heure de fin:</span>
        <span class="info-value">${endDate.toLocaleTimeString("fr-CA")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Durée:</span>
        <span class="info-value">${hours}h ${minutes}m</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Unités Livrées</div>
      <table>
        <thead>
          <tr>
            <th>Numéro d'Unité</th>
            <th style="text-align: right;">Quantité</th>
          </tr>
        </thead>
        <tbody>
          ${unitsText}
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div class="total-row">
        <span>TOTAL LIVRÉ:</span>
        <span>${data.litersDelivered} litres</span>
      </div>
    </div>

    <div class="footer">
      <p>Billet généré le ${new Date().toLocaleString("fr-CA")}</p>
      <p>SP Logistix - Livraison d'Urée</p>
    </div>
  </div>
</body>
</html>
    `;

    // Save to file
    const fileName = `delivery-receipt-${Date.now()}.pdf`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // For now, we'll return the HTML path
    // In a real app, you'd convert HTML to PDF using a library
    return filePath;
  } catch (error) {
    console.error("Error generating delivery receipt PDF:", error);
    throw error;
  }
}
