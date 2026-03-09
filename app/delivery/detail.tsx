import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
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
RAPPORT DE LIVRAISON D'UREE
${"=".repeat(40)}

CLIENT
Nom: ${delivery.clientName}
${delivery.clientCompany ? `Compagnie: ${delivery.clientCompany}` : ""}
${delivery.siteName ? `\nSITE\n${delivery.siteName}` : ""}

DETAILS DE LA LIVRAISON
Date: ${formatDateTime(delivery.startTime)}
Heure de debut: ${new Date(delivery.startTime).toLocaleTimeString("fr-CA")}
Heure de fin: ${new Date(delivery.endTime).toLocaleTimeString("fr-CA")}
Duree: ${formatDuration(delivery.startTime, delivery.endTime)}

QUANTITE LIVREE
${delivery.litersDelivered} litres

${"=".repeat(40)}
Genere le ${new Date().toLocaleString("fr-CA")}
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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Details de la livraison
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Client Info */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>CLIENT</Text>
            <Text style={[styles.clientName, { color: colors.foreground }]}>{delivery.clientName}</Text>
            {delivery.clientCompany ? (
              <Text style={[styles.clientCompany, { color: colors.muted }]}>{delivery.clientCompany}</Text>
            ) : null}
            {delivery.siteName ? (
              <View style={[styles.siteDivider, { borderTopColor: colors.border }]}>
                <Text style={[styles.cardLabel, { color: colors.muted }]}>SITE</Text>
                <Text style={[styles.siteNameText, { color: colors.foreground }]}>{delivery.siteName}</Text>
              </View>
            ) : null}
          </View>

          {/* Delivery Details */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>DETAILS</Text>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Heure de debut</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {formatDateTime(delivery.startTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Heure de fin</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {formatDateTime(delivery.endTime)}
              </Text>
            </View>

            <View>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Duree totale</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {formatDuration(delivery.startTime, delivery.endTime)}
              </Text>
            </View>
          </View>

          {/* Photos Section */}
          <View style={styles.photosSection}>
            <View style={styles.photosSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Photos de livraison</Text>
              {delivery.photos && delivery.photos.length > 0 ? (
                <Text style={[styles.photosCount, { color: colors.muted }]}>
                  ({delivery.photos.length})
                </Text>
              ) : null}
            </View>

            {delivery.photos && delivery.photos.length > 0 ? (
              <View style={styles.photosGrid}>
                {delivery.photos.map((photo, index) => (
                  <View
                    key={index}
                    style={[styles.photoWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  >
                    <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.noPhotos, { backgroundColor: colors.surface }]}>
                <Text style={[styles.noPhotosText, { color: colors.muted }]}>
                  Aucune photo pour cette livraison
                </Text>
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
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>+ Ajouter des photos</Text>
            </TouchableOpacity>
          </View>

          {/* Liters Delivered */}
          <View style={[styles.litersCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.litersLabel}>LITRES LIVRES</Text>
            <Text style={styles.litersValue}>{delivery.litersDelivered}</Text>
            <Text style={styles.litersUnit}>litres</Text>
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
            style={[styles.actionButton, { backgroundColor: colors.primary, marginBottom: 12 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Creer/Regenerer Facture</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.actionButton, { backgroundColor: colors.primary, marginBottom: 20 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Partager / Imprimer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
    width: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 15,
    marginBottom: 8,
  },
  siteDivider: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  siteNameText: {
    fontSize: 15,
    fontWeight: "600",
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  photosSection: {
    marginBottom: 20,
  },
  photosSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },
  photosCount: {
    fontSize: 13,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  photoWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  photo: {
    width: 120,
    height: 120,
  },
  noPhotos: {
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  noPhotosText: {
    fontSize: 14,
    textAlign: "center",
  },
  litersCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  litersLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  litersValue: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "bold",
  },
  litersUnit: {
    color: "#fff",
    fontSize: 18,
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 0,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
