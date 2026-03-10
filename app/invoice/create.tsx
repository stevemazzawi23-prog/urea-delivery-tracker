import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
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
  const { user } = useAuth();
  const { deliveryId } = useLocalSearchParams<{ deliveryId: string }>();

  // Redirect drivers - only admins can create invoices
  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [user]);

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    if (user?.role === "admin") {
      loadDeliveryAndClient();
    }
  }, [deliveryId, user]);

  const loadDeliveryAndClient = async () => {
    if (!deliveryId || user?.role !== "admin") return;

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
      let pdfPath: string | undefined;
      try {
        pdfPath = await generateInvoicePDF({
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
        console.log("PDF generated at:", pdfPath);
      } catch (pdfError) {
        console.warn("PDF generation failed:", pdfError);
      }

      // Generate email body with invoice details
      const emailBody = await generateEmailBody({
        invoiceNumber,
        clientName: client.name,
        litersDelivered: invoice!.litersDelivered,
        total: invoice!.total,
        siteName: delivery!.siteName,
      });

      // Send email with attachment if PDF was generated
      const emailSent = await sendEmailWithAttachment({
        to: [client.email],
        subject: `Facture ${invoiceNumber} - SP Logistix`,
        body: emailBody,
        attachmentPath: pdfPath,
        attachmentMimeType: "application/pdf",
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

      await downloadInvoicePDF(invoiceNumber);
      Alert.alert("Succès", "Facture téléchargée!");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de télécharger la facture.");
    }
  };

  if (!delivery || !client || !invoice) {
  // Show access denied for non-admin users
  if (user?.role !== "admin") {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>Acces Refuse</Text>
          <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", marginBottom: 32 }}>
            Vous n'avez pas la permission d'acceder a cette page. Seuls les administrateurs peuvent creer des factures.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Retour a l'accueil</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text style={{ fontSize: 15, fontWeight: "500", color: colors.primary, width: 60 }}>Retour</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: "600", color: colors.foreground, textAlign: "center" }}>
            Creer Facture
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Invoice Number */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>NUMERO DE FACTURE</Text>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.foreground }}>{invoiceNumber}</Text>
          </View>

          {/* Client Info */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>CLIENT</Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 4 }}>{client.name}</Text>
            {client.company ? (
              <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 8 }}>{client.company}</Text>
            ) : null}
            {client.address ? (
              <Text style={{ fontSize: 13, color: colors.muted }}>{client.address}</Text>
            ) : null}
            {client.email ? (
              <Text style={{ fontSize: 13, color: colors.primary, marginTop: 8 }}>{client.email}</Text>
            ) : null}
          </View>

          {/* Delivery Details */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 12 }}>DETAILS DE LIVRAISON</Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Site</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{delivery.siteName || "Sans site"}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 13, color: colors.muted }}>Quantite livree</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                {invoice.litersDelivered} litres
              </Text>
            </View>
          </View>

          {/* Invoice Breakdown */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 12 }}>DETAIL DE FACTURATION</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Frais de service</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>${invoice.serviceFee.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Livraison ({invoice.litersDelivered}L @ ${invoice.pricePerLiter}/L)</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>${invoice.deliveryCost.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.muted }}>Sous-total</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>${invoice.subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>TPS (5%)</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>${invoice.gst.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>TVQ (9.975%)</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>${invoice.qst.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "bold", color: colors.foreground }}>TOTAL A PAYER</Text>
              <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.primary }}>${invoice.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Terms */}
          <View style={{ backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#FDE68A" }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#78350F", marginBottom: 4 }}>CONDITIONS DE PAIEMENT</Text>
            <Text style={{ fontSize: 13, color: "#92400E" }}>
              Le paiement doit etre effectue dans les 15 jours suivant la date de cette facture.
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleSendInvoice}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Envoyer par Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadPDF}
            style={{
              backgroundColor: colors.surface,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>Telecharger PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShareInvoice}
            style={{
              backgroundColor: colors.surface,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>Partager / Imprimer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
