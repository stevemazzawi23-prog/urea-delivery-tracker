import { useState, useEffect } from "react";
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
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-2xl font-bold text-foreground mb-4">Accès Refusé</Text>
          <Text className="text-base text-muted text-center mb-8">
            Vous n'avez pas la permission d'accéder à cette page. Seuls les administrateurs peuvent créer des factures.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
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
            <Text className="text-primary text-base font-medium">Retour</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-foreground text-center">
            Créer Facture
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Invoice Number */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-2">NUMÉRO DE FACTURE</Text>
            <Text className="text-2xl font-bold text-foreground">{invoiceNumber}</Text>
          </View>

          {/* Client Info */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-2">CLIENT</Text>
            <Text className="text-xl font-bold text-foreground mb-1">{client.name}</Text>
            {client.company ? (
              <Text className="text-base text-muted mb-2">{client.company}</Text>
            ) : null}
            {client.address ? (
              <Text className="text-sm text-muted">{client.address}</Text>
            ) : null}
            {client.email ? (
              <Text className="text-sm text-primary mt-2">{client.email}</Text>
            ) : null}
          </View>

          {/* Delivery Details */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-3">DÉTAILS DE LIVRAISON</Text>
            <View className="mb-2">
              <Text className="text-sm text-muted">Site</Text>
              <Text className="text-base font-semibold text-foreground">{delivery.siteName}</Text>
            </View>
            <View>
              <Text className="text-sm text-muted">Quantité livrée</Text>
              <Text className="text-base font-semibold text-foreground">
                {invoice.litersDelivered} litres
              </Text>
            </View>
          </View>

          {/* Invoice Breakdown */}
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
            <Text className="text-sm font-medium text-muted mb-3">DÉTAIL DE FACTURATION</Text>
            <View className="mb-2 flex-row justify-between">
              <Text className="text-sm text-muted">Frais de service</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${invoice.serviceFee.toFixed(2)}
              </Text>
            </View>
            <View className="mb-3 flex-row justify-between">
              <Text className="text-sm text-muted">
                Livraison ({invoice.litersDelivered}L @ ${invoice.pricePerLiter}/L)
              </Text>
              <Text className="text-sm font-semibold text-foreground">
                ${invoice.deliveryCost.toFixed(2)}
              </Text>
            </View>
            <View className="border-t border-border pt-2 mb-2 flex-row justify-between">
              <Text className="text-sm font-medium text-muted">Sous-total</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${invoice.subtotal.toFixed(2)}
              </Text>
            </View>
            <View className="mb-2 flex-row justify-between">
              <Text className="text-sm text-muted">TPS (5%)</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${invoice.gst.toFixed(2)}
              </Text>
            </View>
            <View className="mb-3 flex-row justify-between">
              <Text className="text-sm text-muted">TVQ (9.975%)</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${invoice.qst.toFixed(2)}
              </Text>
            </View>
            <View className="border-t border-border pt-2 flex-row justify-between">
              <Text className="text-base font-bold text-foreground">TOTAL À PAYER</Text>
              <Text className="text-lg font-bold text-primary">${invoice.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Terms */}
          <View className="bg-yellow-50 rounded-2xl p-4 mb-6 border border-yellow-200">
            <Text className="text-sm font-medium text-yellow-900 mb-1">CONDITIONS DE PAIEMENT</Text>
            <Text className="text-sm text-yellow-800">
              Le paiement doit être effectué dans les 15 jours suivant la date de cette facture.
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
            <Text className="text-white text-base font-semibold">Envoyer par Email</Text>
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
            <Text className="text-foreground text-base font-semibold">Télécharger PDF</Text>
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
            <Text className="text-foreground text-base font-semibold">Partager / Imprimer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
