import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, Platform, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, type Delivery } from "@/lib/storage";

export default function DeliveryDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams<{ deliveryId: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    loadDelivery();
  }, [deliveryId]);

  const loadDelivery = async () => {
    const deliveries = await getDeliveries();
    const found = deliveries.find((d) => d.id === deliveryId);
    if (found) {
      setDelivery(found);
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

  const formatDuration = (startTime: number, endTime: number) => {
    const seconds = Math.floor((endTime - startTime) / 1000);
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
    if (!delivery) return "";

    return `
RAPPORT DE LIVRAISON D'URÉE
${"=".repeat(40)}

CLIENT
Nom: ${delivery.clientName}
${delivery.clientCompany ? `Compagnie: ${delivery.clientCompany}` : ""}
${delivery.siteName ? `\nSITE\n${delivery.siteName}` : ""}

DÉTAILS DE LA LIVRAISON
Date: ${formatDateTime(delivery.startTime)}
Heure de début: ${new Date(delivery.startTime).toLocaleTimeString("fr-CA")}
Heure de fin: ${new Date(delivery.endTime).toLocaleTimeString("fr-CA")}
Durée: ${formatDuration(delivery.startTime, delivery.endTime)}

QUANTITÉ LIVRÉE
${delivery.litersDelivered} litres

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

  if (!delivery) {
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
            Détails de la livraison
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Client Info */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-2">CLIENT</Text>
            <Text className="text-xl font-bold text-foreground mb-1">{delivery.clientName}</Text>
            {delivery.clientCompany ? (
              <Text className="text-base text-muted mb-2">{delivery.clientCompany}</Text>
            ) : null}
            {delivery.siteName ? (
              <View className="mt-2 pt-2 border-t border-border">
                <Text className="text-sm font-medium text-muted mb-1">SITE</Text>
                <Text className="text-base font-semibold text-foreground">{delivery.siteName}</Text>
              </View>
            ) : null}
          </View>

          {/* Delivery Details */}
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-sm font-medium text-muted mb-3">DÉTAILS</Text>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-1">Heure de début</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatDateTime(delivery.startTime)}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-1">Heure de fin</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatDateTime(delivery.endTime)}
              </Text>
            </View>

            <View>
              <Text className="text-sm text-muted mb-1">Durée totale</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatDuration(delivery.startTime, delivery.endTime)}
              </Text>
            </View>
          </View>

          {/* Photos Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-foreground">Photos de livraison</Text>
              {delivery.photos && delivery.photos.length > 0 && (
                <Text className="text-sm text-muted">({delivery.photos.length})</Text>
              )}
            </View>
            
            {delivery.photos && delivery.photos.length > 0 ? (
              <View className="mb-4">
                <View className="flex-row flex-wrap gap-2">
                  {delivery.photos.map((photo, index) => (
                    <View key={index} className="rounded-lg overflow-hidden border border-border bg-surface">
                      <Image source={{ uri: photo }} className="w-32 h-32" resizeMode="cover" />
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className="bg-surface rounded-lg p-4 mb-4">
                <Text className="text-muted text-center">Aucune photo pour cette livraison</Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push({
                  pathname: "/delivery/capture-photo",
                  params: {
                    photosJson: JSON.stringify(delivery.photos || []),
                    isPostDelivery: "true",
                    deliveryId: delivery.id,
                  },
                });
              }}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">+ Ajouter des photos</Text>
            </TouchableOpacity>
          </View>

          {/* Liters Delivered */}
          <View className="bg-primary rounded-2xl p-6 mb-6 items-center">
            <Text className="text-white text-sm font-medium mb-2">LITRES LIVRÉS</Text>
            <Text className="text-white text-5xl font-bold">{delivery.litersDelivered}</Text>
            <Text className="text-white text-lg mt-1">litres</Text>
          </View>

          {/* Create Invoice Button */}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: "/invoice/create",
                params: { deliveryId: delivery.id },
              });
            }}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">Creer/Regenerer Facture</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 20,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">Partager / Imprimer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
