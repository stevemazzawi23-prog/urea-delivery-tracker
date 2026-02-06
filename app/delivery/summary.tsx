import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveDelivery } from "@/lib/storage";

export default function DeliverySummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany, startTime, endTime, litersDelivered } =
    useLocalSearchParams<{
      clientId: string;
      clientName: string;
      clientCompany: string;
      startTime: string;
      endTime: string;
      litersDelivered: string;
    }>();

  const startTimestamp = Number(startTime);
  const endTimestamp = Number(endTime);
  const liters = Number(litersDelivered);
  const durationSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);

  useEffect(() => {
    // Save delivery to storage
    saveDeliveryRecord();
  }, []);

  const saveDeliveryRecord = async () => {
    try {
      await saveDelivery({
        clientId,
        clientName,
        clientCompany,
        startTime: startTimestamp,
        endTime: endTimestamp,
        litersDelivered: liters,
      });
    } catch (error) {
      console.error("Error saving delivery:", error);
    }
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
    return `
RAPPORT DE LIVRAISON D'URÉE
${"=".repeat(40)}

CLIENT
Nom: ${clientName}
${clientCompany ? `Compagnie: ${clientCompany}` : ""}

DÉTAILS DE LA LIVRAISON
Date: ${formatDateTime(startTimestamp)}
Heure de début: ${new Date(startTimestamp).toLocaleTimeString("fr-CA")}
Heure de fin: ${new Date(endTimestamp).toLocaleTimeString("fr-CA")}
Durée: ${formatDuration(durationSeconds)}

QUANTITÉ LIVRÉE
${liters} litres

${"=".repeat(40)}
Généré le ${new Date().toLocaleString("fr-CA")}
    `.trim();
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await Share.share({
        message: generateReport(),
        title: "Rapport de livraison",
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de partager le rapport.");
    }
  };

  const handleNewDelivery = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace({
      pathname: "/delivery/active",
      params: { clientId, clientName, clientCompany },
    });
  };

  const handleBackToHome = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/");
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold text-foreground text-center">
            Livraison terminée
          </Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Success Message */}
          <View className="items-center mb-6">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.success,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text className="text-white text-4xl">✓</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">Livraison réussie</Text>
            <Text className="text-base text-muted text-center">
              La livraison a été enregistrée avec succès
            </Text>
          </View>

          {/* Client Info */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-2">CLIENT</Text>
            <Text className="text-xl font-bold text-foreground mb-1">{clientName}</Text>
            {clientCompany ? (
              <Text className="text-base text-muted">{clientCompany}</Text>
            ) : null}
          </View>

          {/* Delivery Details */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-3">DÉTAILS</Text>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-1">Heure de début</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatDateTime(startTimestamp)}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-1">Heure de fin</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatDateTime(endTimestamp)}
              </Text>
            </View>

            <View>
              <Text className="text-sm text-muted mb-1">Durée totale</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatDuration(durationSeconds)}
              </Text>
            </View>
          </View>

          {/* Liters Delivered */}
          <View className="bg-primary rounded-2xl p-6 mb-6 items-center">
            <Text className="text-white text-sm font-medium mb-2">LITRES LIVRÉS</Text>
            <Text className="text-white text-5xl font-bold">{liters}</Text>
            <Text className="text-white text-lg mt-1">litres</Text>
          </View>

          {/* Action Buttons */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={handleShare}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 12,
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">Partager / Imprimer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNewDelivery}
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
              <Text className="text-foreground text-base font-semibold">
                Nouvelle livraison (même client)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackToHome}
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              activeOpacity={0.8}
            >
              <Text className="text-foreground text-base font-semibold">Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
