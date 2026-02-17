import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getDeliveries,
  getClients,
  saveInvoice,
  calculateInvoice,
  INVOICE_CONFIG,
  type Delivery,
  type Client,
} from "@/lib/storage";
import { generateInvoicePDF, downloadInvoicePDF } from "@/lib/pdf-generator";
import { generateDeliveryReceiptPDF } from "@/lib/delivery-receipt-generator";
import { sendEmailWithAttachment, generateEmailBody } from "@/lib/email-utils";

export default function CreateInvoiceScreen() {
  const colors = useColors();
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams<{ deliveryId: string }>();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    loadDeliveryAndClient();
  }, [deliveryId]);

  const loadDeliveryAndClient = async () => {
    if (!deliveryId) return;

    const deliveries = await getDeliveries();
    const foundDelivery = deliveries.find((d) => d.id === deliveryId);

    if (foundDelivery) {
      setDelivery(foundDelivery);

      const clients = await getClients();
      const foundClient = clients.find((c) => c.id === foundDelivery.clientId);
      setClient(foundClient || null);

      // Generate invoice number based on date and delivery ID
      const date = new Date(foundDelivery.createdAt);
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      const invNum = `INV-${dateStr}-${foundDelivery.id.substring(0, 6).toUpperCase()}`;
      setInvoiceNumber(invNum);

      // Calculate invoice
      const calc = calculateInvoice(foundDelivery.litersDelivered);
      setInvoice({
        ...calc,
        litersDelivered: foundDelivery.litersDelivered,
      });
    }
  };

  const generateInvoiceText = () => {
    if (!delivery || !client || !invoice) return "";

    const date = new Date(delivery.createdAt);
    const dateStr = date.toLocaleDateString("fr-CA");

    return `
FACTURE DE LIVRAISON D'URÉE
${"=".repeat(50)}

Numéro de facture: ${invoiceNumber}
Date: ${dateStr}

FACTURATION À:
${client.name}
${client.company || ""}
${client.address || ""}
${client.email || ""}

DÉTAILS DE LA LIVRAISON:
Site: ${delivery.siteName}
Quantité livrée: ${invoice.litersDelivered} litres

DÉTAIL DE LA FACTURATION:
${"".repeat(50)}
Frais de service:           ${invoice.serviceFee.toFixed(2)}$
Livraison (${invoice.litersDelivered}L @ ${invoice.pricePerLiter}$/L): ${invoice.deliveryCost.toFixed(2)}$
                            --------
Sous-total:                 ${invoice.subtotal.toFixed(2)}$

TPS (5%):                   ${invoice.gst.toFixed(2)}$
TVQ (9.975%):               ${invoice.qst.toFixed(2)}$
                            --------
TOTAL À PAYER:              ${invoice.total.toFixed(2)}$

${"".repeat(50)}
CONDITIONS DE PAIEMENT:
Le paiement doit être effectué dans les 15 jours suivant
la date de cette facture.

${"".repeat(50)}
Merci de votre confiance!
SP Logistix
    `.trim();
  };

  const handleSendInvoice = async () => {
    if (!client?.email) {
      Alert.alert("Erreur", "Le client n'a pas d'adresse email configurée.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Generate invoice PDF
      const pdfPath = await generateInvoicePDF({
        invoiceNumber,
        invoiceDate: Date.now(),
        clientName: client.name,
        clientCompany: client.company,
        clientAddress: client.address,
        clientEmail: client.email,
        siteName: delivery!.siteName,
        litersDelivered: invoice!.litersDelivered,
        serviceFee: invoice.serviceFee,
        pricePerLiter: invoice.pricePerLiter,
        subtotal: invoice!.subtotal,
        gst: invoice!.gst,
        qst: invoice!.qst,
        total: invoice!.total,
      });

      // Generate delivery receipt PDF
      const receiptPath = await generateDeliveryReceiptPDF({
        clientName: client.name,
        clientCompany: client.company,
        siteName: delivery!.siteName,
        driverName: delivery!.driverName,
        startTime: delivery!.startTime,
        endTime: delivery!.endTime,
        litersDelivered: delivery!.litersDelivered,
        units: delivery!.units || [],
      });

      // Generate email body
      const emailBody = await generateEmailBody({
        invoiceNumber,
        clientName: client.name,
        litersDelivered: invoice!.litersDelivered,
        total: invoice!.total,
        siteName: delivery!.siteName,
      });

      // Send email with both invoice and receipt attachments
      const emailSent = await sendEmailWithAttachment({
        to: [client.email],
        subject: `Facture ${invoiceNumber} - SP Logistix`,
        body: emailBody,
        attachmentPath: pdfPath,
        attachmentMimeType: "application/pdf",
        additionalAttachments: [{
          path: receiptPath,
          mimeType: "application/pdf",
          filename: "billet-de-livraison.pdf"
        }],
      });

      // Save invoice to storage
      if (delivery && invoice) {
        await saveInvoice({
          deliveryId: delivery.id,
          clientId: delivery.clientId,
          clientName: client.name,
          clientEmail: client.email,
          clientAddress: client.address,
          invoiceNumber,
          invoiceDate: Date.now(),
          serviceFee: invoice.serviceFee,
          pricePerLiter: invoice.pricePerLiter,
          litersDelivered: invoice.litersDelivered,
          subtotal: invoice.subtotal,
          gst: invoice.gst,
          qst: invoice.qst,
          total: invoice.total,
          status: emailSent ? "sent" : "draft",
        });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Succès", "Facture envoyée avec succès!");
      router.back();
    } catch (error) {
      console.error("Error sending invoice:", error);
      Alert.alert("Erreur", "Impossible d'envoyer la facture.");
    }
  };

  const handleShareInvoice = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const invoiceText = generateInvoiceText();
      await Share.share({
        message: invoiceText,
        title: `Facture ${invoiceNumber}`,
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de partager la facture.");
    }
  };

  const handleDownloadPDF = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (!delivery || !client || !invoice) return;

      const pdfPath = await generateInvoicePDF({
        invoiceNumber,
        invoiceDate: Date.now(),
        clientName: client.name,
        clientCompany: client.company,
        clientAddress: client.address,
        clientEmail: client.email,
        siteName: delivery.siteName,
        litersDelivered: invoice.litersDelivered,
        serviceFee: invoice.serviceFee,
        pricePerLiter: invoice.pricePerLiter,
        subtotal: invoice.subtotal,
        gst: invoice.gst,
        qst: invoice.qst,
        total: invoice.total,
      });

      await downloadInvoicePDF(pdfPath, `${invoiceNumber}.pdf`);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Succès", "Facture téléchargée avec succès!");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de générer la facture PDF.");
    }
  };

  if (!delivery || !client || !invoice) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
            Facture
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            {invoiceNumber}
          </Text>
        </View>

        {/* Client Info */}
        <View
          style={{
            padding: 16,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted }}>FACTURATION À:</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            {client.name}
          </Text>
          {client.company && (
            <Text style={{ fontSize: 14, color: colors.muted }}>{client.company}</Text>
          )}
          {client.address && (
            <Text style={{ fontSize: 14, color: colors.muted }}>{client.address}</Text>
          )}
          {client.email && (
            <Text style={{ fontSize: 14, color: "#1B5E20" }}>{client.email}</Text>
          )}
        </View>

        {/* Delivery Info */}
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground }}>
            Détails de la livraison
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Site:</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                {delivery.siteName}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Quantité livrée:</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                {invoice.litersDelivered} L
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Details */}
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground }}>
            Détail de la facturation
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 12,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Frais de service:</Text>
              <Text style={{ color: colors.foreground }}>
                ${invoice.serviceFee.toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>
                Livraison ({invoice.litersDelivered}L @ ${invoice.pricePerLiter}/L):
              </Text>
              <Text style={{ color: colors.foreground }}>
                ${invoice.deliveryCost.toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 8,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>Sous-total:</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                ${invoice.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>TPS (5%):</Text>
              <Text style={{ color: colors.foreground }}>${invoice.gst.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>TVQ (9.975%):</Text>
              <Text style={{ color: colors.foreground }}>${invoice.qst.toFixed(2)}</Text>
            </View>
            <View
              style={{
                borderTopWidth: 2,
                borderTopColor: colors.border,
                paddingTop: 8,
                marginTop: 8,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground }}>
                TOTAL:
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1B5E20",
                }}
              >
                ${invoice.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ padding: 16, gap: 10 }}>
          <TouchableOpacity
            onPress={handleSendInvoice}
            style={{
              backgroundColor: "#1B5E20",
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              📧 Envoyer par email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadPDF}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              📥 Télécharger PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShareInvoice}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              📤 Partager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              Fermer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
