import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, deleteDelivery, getInvoices, deleteInvoice, updateInvoiceStatus, type Delivery, type Invoice } from "@/lib/storage";
import { useState, useCallback } from "react";

type TabType = "deliveries" | "invoices";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("deliveries");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const deliveriesData = await getDeliveries();
    setDeliveries(deliveriesData.sort((a, b) => b.createdAt - a.createdAt));
    
    const invoicesData = await getInvoices();
    setInvoices(invoicesData.sort((a, b) => b.createdAt - a.createdAt));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
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
            await deleteDelivery(delivery.id);
            await loadData();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            await deleteInvoice(invoice.id);
            await loadData();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        text: "Marquer comme Payée",
        onPress: async () => {
          await updateInvoiceStatus(invoice.id, 'paid');
          await loadData();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Marquer comme Impayée",
        onPress: async () => {
          await updateInvoiceStatus(invoice.id, 'sent');
          await loadData();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ];
    Alert.alert("Changer le statut", "Sélectionnez le nouveau statut", options);
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

  const groupInvoicesByDate = () => {
    const groups: { [key: string]: Invoice[] } = {};
    invoices.forEach((invoice) => {
      const dateKey = formatDate(invoice.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(invoice);
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
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{item.clientName}</Text>
            {item.clientCompany && (
              <Text style={{ fontSize: 12, color: colors.muted }}>{item.clientCompany}</Text>
            )}
            {item.siteName && (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{item.siteName}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>{item.litersDelivered}</Text>
            <Text style={{ fontSize: 10, color: colors.muted }}>litres</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>{formatTime(item.startTime)}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {formatDuration(item.startTime, item.endTime)}
          </Text>
        </View>
        {item.units && item.units.length > 0 && (
          <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Détails:</Text>
            {item.units.map((unit) => (
              <Text key={unit.id} style={{ fontSize: 11, color: colors.foreground }}>
                {unit.unitName}: {unit.liters}L
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      onPress={() => handleChangeInvoiceStatus(item)}
      onLongPress={() => handleDeleteInvoice(item)}
      style={{ opacity: 1 }}
      activeOpacity={0.7}
    >
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{item.clientName}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Facture #{item.invoiceNumber}</Text>
            {item.clientEmail && (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{item.clientEmail}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.primary }}>${item.total.toFixed(2)}</Text>
            <Text style={{ 
              fontSize: 10, 
              paddingHorizontal: 8, 
              paddingVertical: 2, 
              borderRadius: 4,
              backgroundColor: item.status === 'paid' ? '#22C55E' : item.status === 'sent' ? '#3B82F6' : '#9CA3AF',
              color: '#fff',
              marginTop: 4,
              overflow: 'hidden'
            }}>
              {item.status === 'paid' ? 'Payée' : item.status === 'sent' ? 'Envoyée' : 'Brouillon'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>{item.litersDelivered}L @ ${item.pricePerLiter.toFixed(2)}/L</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const groupedDeliveries = groupDeliveriesByDate();
  const deliveryDateKeys = Object.keys(groupedDeliveries);
  
  const groupedInvoices = groupInvoicesByDate();
  const invoiceDateKeys = Object.keys(groupedInvoices);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground }}>Historique</Text>
        </View>

        {/* Tab Buttons */}
        <View style={{ flexDirection: "row", marginBottom: 16, gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("deliveries");
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === "deliveries" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: activeTab === "deliveries" ? colors.primary : colors.border,
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "deliveries" ? "#fff" : colors.foreground,
              textAlign: "center",
            }}>
              📦 Billets ({deliveries.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setActiveTab("invoices");
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === "invoices" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: activeTab === "invoices" ? colors.primary : colors.border,
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "invoices" ? "#fff" : colors.foreground,
              textAlign: "center",
            }}>
              📄 Factures ({invoices.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "deliveries" ? (
          <FlatList
            data={deliveryDateKeys}
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
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 12, textTransform: "uppercase" }}>
                  {dateKey}
                </Text>
                {groupedDeliveries[dateKey].map((delivery) => (
                  <View key={delivery.id}>{renderDelivery({ item: delivery })}</View>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
                <Text style={{ color: colors.muted, textAlign: "center", fontSize: 16 }}>
                  Aucun billet de livraison
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={invoiceDateKeys}
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
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 12, textTransform: "uppercase" }}>
                  {dateKey}
                </Text>
                {groupedInvoices[dateKey].map((invoice) => (
                  <View key={invoice.id}>{renderInvoice({ item: invoice })}</View>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
                <Text style={{ color: colors.muted, textAlign: "center", fontSize: 16 }}>
                  Aucune facture
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
