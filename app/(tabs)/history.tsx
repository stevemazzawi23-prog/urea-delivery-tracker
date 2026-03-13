import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "@/hooks/use-socket";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getDeliveries,
  getInvoices,
  deleteDelivery,
  deleteInvoice,
  updateInvoiceStatus,
  Delivery,
  Invoice,
} from "@/lib/storage";

type TabType = "deliveries" | "invoices";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("deliveries");

  // ── Real-time sync: reload when another device makes changes ──
  useSocket(user?.id, {
    onDeliveriesUpdated: () => loadData(),
    onInvoicesUpdated: () => loadData(),
  });
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
    Alert.alert("Changer le statut", "Selectionnez le nouveau statut", [
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
    ]);
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => b.createdAt - a.createdAt);
  const sortedInvoices = [...invoices].sort((a, b) => b.createdAt - a.createdAt);

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push({ pathname: "/delivery/detail", params: { deliveryId: item.id } });
      }}
      onLongPress={() => handleDeleteDelivery(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.clientName}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
              {item.siteName || "Site non specifie"}
            </Text>
          </View>
          <Text style={[styles.cardBadge, { color: colors.primary }]}>{item.litersDelivered}L</Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.muted }]}>
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
        Alert.alert("Detail de la facture", `Facture ${item.invoiceNumber}\nTotal: $${item.total.toFixed(2)}`);
      }}
      onLongPress={() => handleDeleteInvoice(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.invoiceNumber}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{item.clientName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleChangeInvoiceStatus(item)}
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "paid"
                    ? colors.success
                    : item.status === "sent"
                    ? colors.primary
                    : colors.warning,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === "paid" ? "Payee" : item.status === "sent" ? "Envoyee" : "Brouillon"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardRow}>
          <Text style={[styles.cardDate, { color: colors.muted }]}>${item.total.toFixed(2)}</Text>
          <Text style={[styles.cardDate, { color: colors.muted }]}>
            {new Date(item.invoiceDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.foreground }]}>Historique</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("deliveries")}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === "deliveries" ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "deliveries" ? "#fff" : colors.foreground },
              ]}
            >
              Livraisons
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("invoices")}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === "invoices" ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "invoices" ? "#fff" : colors.foreground },
              ]}
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
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Aucune livraison</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={sortedInvoices}
            renderItem={renderInvoiceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Aucune facture</Text>
              </View>
            }
          />
        )}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "600",
    fontSize: 14,
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
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  cardBadge: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
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
