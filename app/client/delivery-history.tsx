import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
        router.push({
          pathname: "/delivery/detail",
          params: { deliveryId: item.id },
        });
      }}
      style={{ opacity: 1 }}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {item.siteName}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {formatDate(item.createdAt)} à {formatTime(item.startTime)}
            </Text>
          </View>
          <View className="bg-primary rounded-lg px-3 py-1">
            <Text className="text-white font-semibold text-sm">
              {item.litersDelivered}L
            </Text>
          </View>
        </View>

        <View className="border-t border-border pt-2 mt-2">
          <Text className="text-xs text-muted">
            {item.units.length} unité{item.units.length > 1 ? "s" : ""}
          </Text>
          <View className="mt-1">
            {item.units.map((unit, index) => (
              <Text key={index} className="text-xs text-muted">
                • {unit.unitName}: {unit.liters}L
              </Text>
            ))}
          </View>
        </View>

        {item.driverName && (
          <Text className="text-xs text-muted mt-2">
            Livreur: {item.driverName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
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
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View className="flex-1 ml-3">
            <Text className="text-2xl font-bold text-foreground">
              Billets de livraison
            </Text>
            <Text className="text-sm text-muted">{clientName}</Text>
          </View>
        </View>

        {/* Delivery List */}
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted text-center text-base">
                Aucun billet de livraison pour ce client
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
