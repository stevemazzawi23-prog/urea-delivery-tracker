import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, getInvoices, deleteDelivery, deleteInvoice, updateInvoiceStatus, Delivery, Invoice } from "@/lib/storage";

type TabType = "deliveries" | "invoices";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("deliveries");
  const [refreshing, setRefreshing] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dels, invs] = await Promise.all([getDeliveries(), getInvoices()]);
      setDeliveries(dels);
      setInvoices(invs);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
            try {
              await deleteDelivery(delivery.id);
              await loadData();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la livraison");
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    Alert.alert(
      "Supprimer la facture",
      "Voulez-vous vraiment supprimer cette facture?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInvoice(invoice.id);
              await loadData();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la facture");
            }
          },
        },
      ]
    );
  };

  const handleChangeInvoiceStatus = (invoice: Invoice) => {
    const options = [
      { text: "Annuler", style: "cancel" as const },
      {
        text: "Marquer comme Payee",
        onPress: async () => {
          await updateInvoiceStatus(invoice.id, "paid");
          await loadData();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Marquer comme Envoyee",
        onPress: async () => {
          await updateInvoiceStatus(invoice.id, "sent");
          await loadData();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Marquer comme Brouillon",
        onPress: async () => {
          await updateInvoiceStatus(invoice.id, "draft");
          await loadData();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ];

    Alert.alert("Changer le statut", "Selectionnez le nouveau statut", options);
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => b.createdAt - a.createdAt);
  const sortedInvoices = [...invoices].sort((a, b) => b.createdAt - a.createdAt);

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
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
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.clientName}</Text>
            <Text className="text-sm text-muted">{item.siteName || "Site non specifie"}</Text>
          </View>
          <Text className="text-sm font-medium text-primary">{item.litersDelivered}L</Text>
        </View>
        <Text className="text-xs text-muted">
          {new Date(item.startTime).toLocaleString("fr-FR")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Alert.alert("Detail de la facture", "Facture " + item.invoiceNumber + "\nTotal: $" + item.total.toFixed(2));
      }}
      onLongPress={() => handleDeleteInvoice(item)}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.invoiceNumber}</Text>
            <Text className="text-sm text-muted">{item.clientName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleChangeInvoiceStatus(item)}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor:
                item.status === "paid"
                  ? colors.success
                  : item.status === "sent"
                  ? colors.primary
                  : colors.warning,
            }}
          >
            <Text className="text-xs font-medium text-white capitalize">
              {item.status === "paid" ? "Payee" : item.status === "sent" ? "Envoyee" : "Brouillon"}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">${item.total.toFixed(2)}</Text>
          <Text className="text-xs text-muted">
            {new Date(item.invoiceDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-4">
        <Text className="text-3xl font-bold text-foreground mb-4">Historique</Text>
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab("deliveries")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "deliveries" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className={"text-center font-semibold " + (activeTab === "deliveries" ? "text-white" : "text-foreground")}
            >
              Livraisons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("invoices")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "invoices" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className={"text-center font-semibold " + (activeTab === "invoices" ? "text-white" : "text-foreground")}
            >
              Factures
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === "deliveries" ? (
          <FlatList
            data={sortedDeliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-center">Aucune livraison</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={sortedInvoices}
            renderItem={renderInvoiceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-center">Aucune facture</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
