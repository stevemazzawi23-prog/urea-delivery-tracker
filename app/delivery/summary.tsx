import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, Platform, Image, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveDelivery, DeliveryUnit, getClients } from "@/lib/storage";
import { removeAccents } from "@/lib/accent-remover";
import { syncDeliveryToPortal, generateTicketNumber } from "@/lib/portal-sync";

export default function DeliverySummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany, siteId, siteName, startTime, endTime, litersDelivered, unitsJson, photosJson, driverName, clientPortalCode } =
    useLocalSearchParams<{ clientId: string; clientName: string; clientCompany: string; siteId: string; siteName: string; startTime: string; endTime: string; litersDelivered: string; unitsJson?: string; photosJson: string; driverName?: string; clientPortalCode?: string; }>();

  const [photos, setPhotos] = useState<string[]>(photosJson ? JSON.parse(photosJson) : []);
  const [units, setUnits] = useState<DeliveryUnit[]>(unitsJson ? JSON.parse(unitsJson) : []);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [portalSyncStatus, setPortalSyncStatus] = useState<"idle" | "syncing" | "success" | "error" | "no-code">("idle");
  const [portalSyncMessage, setPortalSyncMessage] = useState<string>("");
  const [ticketNumber] = useState(() => generateTicketNumber());

  const startTimestamp = Number(startTime);
  const endTimestamp = Number(endTime);
  const liters = Number(litersDelivered);
  const durationSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);

  useEffect(() => { saveDeliveryRecord(); }, []);

  const saveDeliveryRecord = async () => {
    try {
      const delivery = await saveDelivery({ clientId, clientName, clientCompany, siteId, siteName, driverName, startTime: startTimestamp, endTime: endTimestamp, units, litersDelivered: liters, photos });
      setDeliveryId(delivery.id);
      await syncToPortal();
    } catch (error) { console.error("Error saving delivery:", error); }
  };

  const syncToPortal = async () => {
    try {
      setPortalSyncStatus("syncing");
      
      // 1. Essayer d'utiliser le code portail passé en paramètre (pour les clients du portail)
      let codeToUse = clientPortalCode;
      
      // 2. Si pas de code en paramètre, chercher dans le stockage local
      if (!codeToUse) {
        const clients = await getClients();
        const client = clients.find((c) => c.id === clientId);
        codeToUse = client?.portalCode;
      }
      
      if (!codeToUse) {
        setPortalSyncStatus("no-code");
        setPortalSyncMessage("Code portail manquant. Modifiez le client pour ajouter son code portail.");
        return;
      }
      
      const result = await syncDeliveryToPortal({ 
        clientCode: codeToUse, 
        ticketNumber, 
        startTime: startTimestamp, 
        endTime: endTimestamp, 
        totalLiters: liters, 
        units: units.map((u) => ({ unitName: u.unitName, liters: u.liters })), 
        driverName: driverName || "Non specifie", 
        siteName: siteName || "" 
      });
      
      if (result.success) { 
        setPortalSyncStatus("success"); 
        setPortalSyncMessage(result.message); 
      } else { 
        setPortalSyncStatus("error"); 
        setPortalSyncMessage(result.message || "Erreur de synchronisation"); 
      }
    } catch (error: any) { 
      setPortalSyncStatus("error"); 
      setPortalSyncMessage("Impossible de contacter le portail"); 
    }
  };

  const handleAddPhotos = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/delivery/capture-photo", params: { photosJson: JSON.stringify(photos), isPostDelivery: "true", deliveryId: deliveryId || "" } });
  };

  const formatDateTime = (timestamp: number) => new Date(timestamp).toLocaleString("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    else if (minutes > 0) return `${minutes}min ${secs}s`;
    else return `${secs}s`;
  };

  const generateReport = () => {
    const unitsText = units.map((unit) => `  - ${removeAccents(unit.unitName)}: ${unit.liters} L`).join("\n");
    return `RAPPORT DE LIVRAISON D'UREE\n${"=".repeat(50)}\nCLIENT: ${removeAccents(clientName)}\nENTREPRISE: ${removeAccents(clientCompany || "N/A")}\nSITE: ${removeAccents(siteName)}\nLIVREUR: ${removeAccents(driverName || "Non specifie")}\nBILLET: ${ticketNumber}\n\nDATE: ${formatDateTime(startTimestamp)}\nDUREE: ${formatDuration(durationSeconds)}\n\nDETAIL DES UNITES:\n${unitsText}\n\nTOTAL LIVRE: ${liters} litres\n${"=".repeat(50)}\nRapport genere le ${new Date().toLocaleString("fr-CA")}`.trim();
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await Share.share({ message: generateReport(), title: `Rapport de livraison - ${clientName}` }); }
    catch (error) { Alert.alert("Erreur", "Impossible de partager le rapport"); }
  };

  const handleRetrySyncPortal = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await syncToPortal();
  };

  const handleFinish = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  const getSyncBannerStyle = () => {
    switch (portalSyncStatus) {
      case "syncing": return { backgroundColor: "#1a5f3f20", borderColor: "#1a5f3f" };
      case "success": return { backgroundColor: "#16a34a20", borderColor: "#16a34a" };
      case "error": return { backgroundColor: "#dc262620", borderColor: "#dc2626" };
      case "no-code": return { backgroundColor: "#f5900020", borderColor: "#f59000" };
      default: return { backgroundColor: colors.surface, borderColor: colors.border };
    }
  };

  const getSyncIcon = () => {
    switch (portalSyncStatus) {
      case "syncing": return "⏳";
      case "success": return "✅";
      case "error": return "❌";
      case "no-code": return "⚠️";
      default: return "🔄";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Résumé de livraison</Text>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>{liters} litres</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Billet: {ticketNumber}</Text>
        </View>

        {portalSyncStatus !== "idle" && (
          <View style={{ margin: 16, padding: 12, borderRadius: 10, borderWidth: 1, ...getSyncBannerStyle() }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {portalSyncStatus === "syncing" ? (<ActivityIndicator size="small" color="#1a5f3f" />) : (<Text style={{ fontSize: 16 }}>{getSyncIcon()}</Text>)}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: colors.foreground, fontSize: 13 }}>
                  {portalSyncStatus === "syncing" ? "Synchronisation avec le portail..." : portalSyncStatus === "success" ? "Synchronisé avec le portail SP Logistix" : portalSyncStatus === "no-code" ? "Code portail manquant" : "Erreur de synchronisation"}
                </Text>
                {portalSyncMessage ? (<Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{portalSyncMessage}</Text>) : null}
              </View>
            </View>
            {(portalSyncStatus === "error" || portalSyncStatus === "no-code") && (
              <TouchableOpacity onPress={handleRetrySyncPortal} style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignSelf: "flex-start" }}>
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>🔄 Réessayer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 }}>
          <View>
            <Text style={{ fontSize: 12, color: colors.muted }}>Client</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{clientName}</Text>
            {clientCompany && (<Text style={{ fontSize: 14, color: colors.muted }}>{clientCompany}</Text>)}
          </View>
          {driverName && (<View><Text style={{ fontSize: 12, color: colors.muted }}>Livreur</Text><Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{driverName}</Text></View>)}
          <View><Text style={{ fontSize: 12, color: colors.muted }}>Site</Text><Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{siteName}</Text></View>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Heure de début</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>{formatDateTime(startTimestamp)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Heure de fin</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>{formatDateTime(endTimestamp)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted }}>Durée</Text>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>{formatDuration(durationSeconds)}</Text>
            </View>
          </View>
        </View>

        {units.length > 0 && (
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>Unités livrées</Text>
            {units.map((unit) => (
              <View key={unit.id} style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{unit.unitName}</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>{unit.liters} L</Text>
              </View>
            ))}
            <View style={{ backgroundColor: colors.primary + "15", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.primary }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>TOTAL</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>{liters} L</Text>
            </View>
          </View>
        )}

        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>Photos ({photos.length})</Text>
          </View>
          {photos.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {photos.map((photo, idx) => (<Image key={idx} source={{ uri: photo }} style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: colors.surface }} />))}
            </View>
          ) : (<Text style={{ color: colors.muted, fontSize: 14 }}>Aucune photo</Text>)}
          <TouchableOpacity onPress={handleAddPhotos} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" }} activeOpacity={0.8}>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>+ Ajouter une photo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          <TouchableOpacity onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/invoice/create", params: { deliveryId } }); }} style={{ backgroundColor: "#1B5E20", paddingVertical: 12, borderRadius: 10, alignItems: "center" }} activeOpacity={0.8}>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>💰 Créer une facture</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 10, alignItems: "center" }} activeOpacity={0.8}>
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>📤 Partager le rapport</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFinish} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 10, alignItems: "center" }} activeOpacity={0.8}>
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>✓ Terminer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
