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
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, deleteDelivery, type Delivery } from "@/lib/storage";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = async () => {
    const data = await getDeliveries();
    setDeliveries(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  useFocusEffect(
    useCallback(() => {
      loadDeliveries();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  };

  const handleDeleteDelivery = (delivery: Delivery) => {
    Alert.alert(
      "Supprimer la livraison",
      "Voulez-vous vraiment supprimer cette livraison?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteDelivery(delivery.id);
            await loadDeliveries();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const seconds = Math.floor((endTime - startTime) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  };

  const groupDeliveriesByDate = () => {
    const groups: { [key: string]: Delivery[] } = {};
    deliveries.forEach((delivery) => {
      const dateKey = formatDate(delivery.startTime);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(delivery);
    });
    return groups;
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
      onLongPress={() => handleDeleteDelivery(item)}
      style={{ opacity: 1 }}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.clientName}</Text>
            {item.clientCompany ? (
              <Text className="text-sm text-muted">{item.clientCompany}</Text>
            ) : null}
            {item.siteName ? (
              <Text className="text-xs text-muted mt-1">{item.siteName}</Text>
            ) : null}
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold text-primary">{item.litersDelivered}</Text>
            <Text className="text-xs text-muted">litres</Text>
          </View>
        </View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-muted">{formatTime(item.startTime)}</Text>
          <Text className="text-sm text-muted">
            {formatDuration(item.startTime, item.endTime)}
          </Text>
        </View>
        {item.units && item.units.length > 0 && (
          <View className="bg-background rounded-lg p-2 mt-2">
            <Text className="text-xs text-muted mb-1">Details:</Text>
            {item.units.map((unit) => (
              <Text key={unit.id} className="text-xs text-foreground">
                {unit.unitName}: {unit.liters}L
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const groupedDeliveries = groupDeliveriesByDate();
  const dateKeys = Object.keys(groupedDeliveries);

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Historique</Text>
        </View>

        {/* Delivery List */}
        <FlatList
          data={dateKeys}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: dateKey }) => (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-muted mb-3 uppercase">{dateKey}</Text>
              {groupedDeliveries[dateKey].map((delivery) => (
                <View key={delivery.id}>{renderDelivery({ item: delivery })}</View>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted text-center text-base">
                Aucune livraison enregistrée
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
