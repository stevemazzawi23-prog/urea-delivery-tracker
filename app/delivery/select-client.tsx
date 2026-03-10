import { View, Text, TouchableOpacity, Platform, TextInput, FlatList, Alert, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClients, getDeliveriesByClient, type Client, type Delivery } from "@/lib/storage";
import { useState, useCallback } from "react";

export default function SelectClientScreen() {
  const colors = useColors();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deliveryHistory, setDeliveryHistory] = useState<Record<string, Delivery[]>>({});

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsList = await getClients();
      const sorted = [...clientsList].sort((a, b) => b.createdAt - a.createdAt);
      setClients(sorted);
      setFilteredClients(sorted);

      // Load delivery history for each client
      const history: Record<string, Delivery[]> = {};
      for (const client of sorted) {
        const deliveries = await getDeliveriesByClient(client.id);
        history[client.id] = deliveries.sort((a, b) => b.createdAt - a.createdAt);
      }
      setDeliveryHistory(history);
    } catch (error) {
      console.error("Error loading clients:", error);
      Alert.alert("Erreur", "Impossible de charger la liste des clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(text.toLowerCase()) ||
          (client.company && client.company.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  };

  const handleSelectClient = (client: Client) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/delivery/select-site",
      params: {
        clientId: client.id,
        clientName: client.name,
        clientCompany: client.company || "",
      },
    });
  };

  const renderClientItem = ({ item }: { item: Client }) => {
    const deliveries = deliveryHistory[item.id] || [];
    const lastDelivery = deliveries.length > 0 ? deliveries[0] : null;
    const lastDeliveryDate = lastDelivery
      ? new Date(lastDelivery.createdAt).toLocaleDateString("fr-CA")
      : null;
    const totalLiters = deliveries.reduce((sum, d) => sum + (d.litersDelivered || 0), 0);

    return (
      <TouchableOpacity
        onPress={() => handleSelectClient(item)}
        style={[styles.clientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.clientName, { color: colors.foreground }]}>{item.name}</Text>
        {item.company ? (
          <Text style={[styles.clientCompany, { color: colors.muted }]}>{item.company}</Text>
        ) : null}
        {item.address ? (
          <Text style={[styles.clientAddress, { color: colors.muted }]}>📍 {item.address}</Text>
        ) : null}

        <View style={[styles.historySection, { borderTopColor: colors.border }]}>
          {deliveries.length > 0 ? (
            <>
              <Text style={[styles.historyTitle, { color: colors.foreground }]}>
                📦 Historique ({deliveries.length})
              </Text>
              <Text style={[styles.historyText, { color: colors.muted }]}>
                Dernière livraison: {lastDeliveryDate}
              </Text>
              <Text style={[styles.historyText, { color: colors.muted }]}>
                Total: {totalLiters} L
              </Text>
            </>
          ) : (
            <Text style={[styles.noHistory, { color: colors.muted }]}>
              Aucune livraison précédente
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.title, { color: colors.foreground }]}>Sélectionner un client</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Choisissez le client pour cette livraison
      </Text>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
        placeholder="Rechercher un client..."
        placeholderTextColor={colors.muted}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.muted }]}>
        {loading
          ? "Chargement des clients..."
          : searchQuery
          ? "Aucun client trouvé"
          : "Aucun client disponible"}
      </Text>
      {!loading && !searchQuery && (
        <Text style={[styles.emptySubtext, { color: colors.muted }]}>
          Ajoutez un client dans l'onglet Clients
        </Text>
      )}
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
          activeOpacity={0.6}
        >
          <Text style={[styles.cancelButton, { color: colors.primary }]}>Annuler</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList handles all scrolling - no nested ScrollView */}
      <FlatList
        data={loading ? [] : filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listHeader: {
    paddingTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    fontSize: 14,
  },
  clientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 14,
    marginBottom: 8,
  },
  clientAddress: {
    fontSize: 12,
    marginBottom: 8,
  },
  historySection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  historyText: {
    fontSize: 11,
    marginBottom: 4,
  },
  noHistory: {
    fontSize: 11,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
  },
});
