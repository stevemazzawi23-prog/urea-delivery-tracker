import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";


type TabType = "deliveries" | "invoices";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("deliveries");
  const [refreshing, setRefreshing] = useState(false);

  // Use tRPC queries
  const { data: deliveries = [], refetch: refetchDeliveries, isLoading: loadingDeliveries } = trpc.delivery.listDeliveries.useQuery();
  const { data: invoices = [], refetch: refetchInvoices, isLoading: loadingInvoices } = trpc.invoices.listInvoices.useQuery();

  // Use tRPC mutations
  const deleteDeliveryMutation = trpc.delivery.deleteDelivery.useMutation({
    onSuccess: () => {
      refetchDeliveries();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const deleteInvoiceMutation = trpc.invoices.deleteInvoice.useMutation({
    onSuccess: () => {
      refetchInvoices();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const updateInvoiceStatusMutation = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      refetchInvoices();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetchDeliveries();
      refetchInvoices();
    }, [refetchDeliveries, refetchInvoices])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDeliveries(), refetchInvoices()]);
    setRefreshing(false);
  };

  const handleDeleteDelivery = (delivery: any) => {
    Alert.alert(
      "Supprimer la livraison",
      "Voulez-vous vraiment supprimer cette livraison?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteDeliveryMutation.mutateAsync({ deliveryId: delivery.id });
          },
        },
      ]
    );
  };

  const handleDeleteInvoice = (invoice: any) => {
    Alert.alert(
      "Supprimer la facture",
      "Voulez-vous vraiment supprimer cette facture?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteInvoiceMutation.mutateAsync({ invoiceId: invoice.id });
          },
        },
      ]
    );
  };

  const handleChangeInvoiceStatus = (invoice: any) => {
    const options = [
      { text: "Annuler", style: "cancel" as const },
      {
        text: "Marquer comme Payée",
        onPress: async () => {
          await updateInvoiceStatusMutation.mutateAsync({ invoiceId: invoice.id, status: 'paid' });
        },
      },
      {
        text: "Marquer comme Envoyée",
        onPress: async () => {
          await updateInvoiceStatusMutation.mutateAsync({ invoiceId: invoice.id, status: 'sent' });
        },
      },
      {
        text: "Marquer comme Brouillon",
        onPress: async () => {
          await updateInvoiceStatusMutation.mutateAsync({ invoiceId: invoice.id, status: 'draft' });
        },
      },
    ];

    Alert.alert("Changer le statut", "Sélectionnez le nouveau statut", options);
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const renderDeliveryItem = ({ item }: { item: any }) => (
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
            <Text className="text-sm text-muted">{item.siteName || "Site non spécifié"}</Text>
          </View>
          <Text className="text-sm font-medium text-primary">{item.litersDelivered}L</Text>
        </View>
        <Text className="text-xs text-muted">
          {new Date(item.startTime).toLocaleString("fr-FR")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderInvoiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        // TODO: Create invoice detail screen
        Alert.alert("Détail de la facture", `Facture ${item.invoiceNumber}\nTotal: $${(item.total / 100).toFixed(2)}`);
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
              {item.status === "paid" ? "Payée" : item.status === "sent" ? "Envoyée" : "Brouillon"}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">${(item.total / 100).toFixed(2)}</Text>
          <Text className="text-xs text-muted">
            {new Date(item.invoiceDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const isLoading = activeTab === "deliveries" ? loadingDeliveries : loadingInvoices;

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
        {/* Header */}
        <Text className="text-3xl font-bold text-foreground mb-4">Historique</Text>

        {/* Tab Buttons */}
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
              className={`text-center font-semibold ${
                activeTab === "deliveries" ? "text-white" : "text-foreground"
              }`}
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
              className={`text-center font-semibold ${
                activeTab === "invoices" ? "text-white" : "text-foreground"
              }`}
            >
              Factures
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "deliveries" ? (
          <FlatList
            data={sortedDeliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => item.id.toString()}
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
                <Text className="text-muted text-center">Aucune livraison</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={sortedInvoices}
            renderItem={renderInvoiceItem}
            keyExtractor={(item) => item.id.toString()}
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
                <Text className="text-muted text-center">Aucune facture</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
