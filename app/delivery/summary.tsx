import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, Platform, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveDelivery, DeliveryUnit } from "@/lib/storage";
import { removeAccents } from "@/lib/accent-remover";

export default function DeliverySummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany, siteId, siteName, startTime, endTime, litersDelivered, unitsJson, photosJson, driverName } =
    useLocalSearchParams<{
      clientId: string;
      clientName: string;
      clientCompany: string;
      siteId: string;
      siteName: string;
      startTime: string;
      endTime: string;
      litersDelivered: string;
      unitsJson?: string;
      photosJson: string;
      driverName?: string;
    }>();

  const [photos, setPhotos] = useState<string[]>(photosJson ? JSON.parse(photosJson) : []);
  const [units, setUnits] = useState<DeliveryUnit[]>(unitsJson ? JSON.parse(unitsJson) : []);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  const startTimestamp = Number(startTime);
  const endTimestamp = Number(endTime);
  const liters = Number(litersDelivered);
  const durationSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);

  useEffect(() => {
    saveDeliveryRecord();
  }, []);

  const saveDeliveryRecord = async () => {
    try {
      const delivery = await saveDelivery({
        clientId,
        clientName,
        clientCompany,
        siteId,
        siteName,
        driverName,
        startTime: startTimestamp,
        endTime: endTimestamp,
        units,
        litersDelivered: liters,
        photos,
      });
      setDeliveryId(delivery.id);
    } catch (error) {
      console.error("Error saving delivery:", error);
    }
  };

  const handleAddPhotos = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/delivery/capture-photo",
      params: { 
        photosJson: JSON.stringify(photos),
        isPostDelivery: "true",
        deliveryId: deliveryId || "",
      },
    });
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const generateReport = () => {
    const cleanClientName = removeAccents(clientName);
    const cleanClientCompany = removeAccents(clientCompany || "N/A");
    const cleanSiteName = removeAccents(siteName);
    const cleanDriverName = removeAccents(driverName || "Non specifie");
    
    const unitsText = units
      .map((unit) => `  • ${removeAccents(unit.unitName)}: ${unit.liters} L`)
      .join("\n");

    return `
RAPPORT DE LIVRAISON D'UREE
${"=".repeat(50)}

CLIENT: ${cleanClientName}
ENTREPRISE: ${cleanClientCompany}
SITE: ${cleanSiteName}
LIVREUR: ${cleanDriverName}

DATE: ${formatDateTime(startTimestamp)}
DUREE: ${formatDuration(durationSeconds)}

DETAIL DES UNITES:
${unitsText}

TOTAL LIVRE: ${liters} litres

${"=".repeat(50)}
Rapport genere le ${new Date().toLocaleString("fr-CA")}
    `.trim();
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const report = generateReport();
      await Share.share({
        message: report,
        title: `Rapport de livraison - ${clientName}`,
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de partager le rapport");
    }
  };

  const handleSendEmailPOD = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("POD Email", "Fonctionnalité d'envoi d'email en cours de configuration");
  };

  const handleFinish = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={{ backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Résumé de livraison</Text>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            {liters} litres
          </Text>
        </View>

        {/* Client Info */}
        <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 }}>
          <View>
            <Text style={{ fontSize: 12, color: colors.muted }}>Client</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {clientName}
            </Text>
            {clientCompany && (
              <Text style={{ fontSize: 14, color: colors.muted }}>
                {clientCompany}
              </Text>
            )}
          </View>
          {driverName && (
            <View>
              <Text style={{ fontSize: 12, color: colors.muted }}>Livreur</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                {driverName}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ fontSize: 12, color: colors.muted }}>Site</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {siteName}
            </Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Heure de début</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                {formatDateTime(startTimestamp)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Heure de fin</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                {formatDateTime(endTimestamp)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Durée</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                {formatDuration(durationSeconds)}
              </Text>
            </View>
          </View>
        </View>

        {/* Units Section */}
        {units.length > 0 && (
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
              Unités livrées
            </Text>
            {units.map((unit) => (
              <View
                key={unit.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {unit.unitName}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1B5E20" }}>
                  {unit.liters} L
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Photos Section */}
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
              Photos ({photos.length})
            </Text>
          </View>

          {photos.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {photos.map((photo, idx) => (
                <Image
                  key={idx}
                  source={{ uri: photo }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                  }}
                />
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 14 }}>Aucune photo</Text>
          )}

          <TouchableOpacity
            onPress={handleAddPhotos}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              + Ajouter une photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={{ padding: 16, gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: "/invoice/create",
                params: { deliveryId },
              });
            }}
            style={{
              backgroundColor: "#1B5E20",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              💰 Créer une facture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              📤 Partager le rapport
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendEmailPOD}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              📧 Envoyer par email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFinish}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              ✓ Terminer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
