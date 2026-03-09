import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, type Delivery } from "@/lib/storage";

export default function DeliveryHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = async () => {
    try {
      const allDeliveries = await getDeliveries();
      const clientDeliveries = allDeliveries.filter(
        (delivery) => delivery.clientId === clientId
      );
      setDeliveries(clientDeliveries.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error loading deliveries:", error);
      Alert.alert("Erreur", "Impossible de charger les billets de livraison");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDeliveries();
    }, [clientId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push({ pathname: "/delivery/detail", params: { deliveryId: item.id } });
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Text style={[styles.siteName, { color: colors.foreground }]}>
              {item.siteName || "Sans site"}
            </Text>
            <Text style={[styles.dateText, { color: colors.muted }]}>
              {formatDate(item.createdAt)} a {formatTime(item.startTime)}
            </Text>
          </View>
          <View style={[styles.litersBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.litersText}>{item.litersDelivered}L</Text>
          </View>
        </View>

        <View style={[styles.divider, { borderTopColor: colors.border }]}>
          <Text style={[styles.unitCount, { color: colors.muted }]}>
            {item.units.length} unite{item.units.length > 1 ? "s" : ""}
          </Text>
          {item.units.map((unit, index) => (
            <Text key={index} style={[styles.unitText, { color: colors.muted }]}>
              • {unit.unitName}: {unit.liters}L
            </Text>
          ))}
        </View>

        {item.driverName ? (
          <Text style={[styles.driverText, { color: colors.muted }]}>
            Livreur: {item.driverName}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>‹ Retour</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>Billets de livraison</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{clientName}</Text>
          </View>
        </View>

        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Aucun billet de livraison pour ce client
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
  },
  siteName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
  },
  litersBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  litersText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  divider: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  unitCount: {
    fontSize: 12,
    marginBottom: 4,
  },
  unitText: {
    fontSize: 12,
    marginBottom: 2,
  },
  driverText: {
    fontSize: 12,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
});
