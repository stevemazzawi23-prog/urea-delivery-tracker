import { View, Text, TouchableOpacity, Platform, TextInput, FlatList, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClients, getDeliveriesByClient, type Client, type Delivery } from "@/lib/storage";
import { getPortalClients, refreshPortalClients, type PortalClient } from "@/lib/portal-clients";
import { useState, useCallback } from "react";

// Client unifié : peut venir du portail ou du stockage local
interface UnifiedClient {
  id: string;
  name: string;
  company?: string;
  address?: string;
  portalCode?: string;
  source: "portal" | "local";
  portalData?: PortalClient;
}

export default function SelectClientScreen() {
  const colors = useColors();
  const router = useRouter();
  const [clients, setClients] = useState<UnifiedClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<UnifiedClient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deliveryHistory, setDeliveryHistory] = useState<Record<string, Delivery[]>>({});
  const [portalClientCount, setPortalClientCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const loadClients = async () => {
    try {
      setLoading(true);

      // Charger les clients locaux
      const localClients = await getClients();

      // Charger les clients du portail
      const portalResult = await getPortalClients();
      const portalClients: PortalClient[] = portalResult.success ? portalResult.clients : [];
      setPortalClientCount(portalClients.length);

      // Fusionner : les clients du portail d'abord, puis les clients locaux qui ne sont pas dans le portail
      const portalCodes = new Set(portalClients.map(c => c.code.toLowerCase()));
      const localOnlyClients = localClients.filter(c => !c.portalCode || !portalCodes.has(c.portalCode.toLowerCase()));

      const unified: UnifiedClient[] = [
        // Clients du portail
        ...portalClients.map(pc => ({
          id: `portal-${pc.id}`,
          name: pc.name,
          company: pc.btuName || pc.managementType || undefined,
          address: [pc.address, pc.city, pc.province].filter(Boolean).join(", ") || undefined,
          portalCode: pc.code,
          source: "portal" as const,
          portalData: pc,
        })),
        // Clients locaux uniquement (non présents dans le portail)
        ...localOnlyClients.map(lc => ({
          id: lc.id,
          name: lc.name,
          company: lc.company || undefined,
          address: lc.address || undefined,
          portalCode: lc.portalCode || undefined,
          source: "local" as const,
        })),
      ];

      setClients(unified);
      setFilteredClients(unified);

      // Charger l'historique de livraison pour les clients locaux
      const history: Record<string, Delivery[]> = {};
      for (const lc of localClients) {
        const deliveries = await getDeliveriesByClient(lc.id);
        history[lc.id] = deliveries.sort((a, b) => b.createdAt - a.createdAt);
        // Aussi indexer par portalCode pour les clients portail
        if (lc.portalCode) {
          history[`portal-${lc.portalCode}`] = history[lc.id];
        }
      }
      setDeliveryHistory(history);
    } catch (error) {
      console.error("Error loading clients:", error);
      Alert.alert("Erreur", "Impossible de charger la liste des clients");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setSyncing(true);
      await refreshPortalClients();
      await loadClients();
      Alert.alert("Synchronisé", "La liste des clients a été mise à jour depuis le portail.");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de synchroniser avec le portail.");
    } finally {
      setSyncing(false);
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
          (client.company && client.company.toLowerCase().includes(text.toLowerCase())) ||
          (client.portalCode && client.portalCode.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  };

  const handleSelectClient = (client: UnifiedClient) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/delivery/select-site",
      params: {
        clientId: client.id,
        clientName: client.name,
        clientCompany: client.company || "",
        clientPortalCode: client.portalCode || "",
      },
    });
  };

  const renderClientItem = ({ item }: { item: UnifiedClient }) => {
    const deliveries = deliveryHistory[item.id] || deliveryHistory[`portal-${item.portalCode}`] || [];
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
        <View style={styles.clientHeader}>
          <Text style={[styles.clientName, { color: colors.foreground }]}>{item.name}</Text>
          {item.source === "portal" && (
            <View style={[styles.portalBadge, { backgroundColor: "#1B5E20" }]}>
              <Text style={styles.portalBadgeText}>PORTAIL</Text>
            </View>
          )}
        </View>
        {item.portalCode ? (
          <Text style={[styles.clientCode, { color: colors.muted }]}>Code: {item.portalCode}</Text>
        ) : null}
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
        {portalClientCount > 0
          ? `${portalClientCount} client(s) depuis le portail`
          : "Choisissez le client pour cette livraison"}
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
        placeholder="Rechercher un client ou un code..."
        placeholderTextColor={colors.muted}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
      />
      <TouchableOpacity
        onPress={handleRefresh}
        disabled={syncing}
        style={[styles.syncButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.syncButtonText, { color: colors.primary }]}>
            🔄 Synchroniser avec le portail
          </Text>
        )}
      </TouchableOpacity>
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
          Ajoutez des clients sur le portail SP Logistix ou dans l'onglet Clients
        </Text>
      )}
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
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
          <Text style={[styles.cancelButton, { color: colors.primary }]}>Annuler</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList handles all scrolling */}
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
    marginBottom: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  syncButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  clientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  portalBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  portalBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  clientCode: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: "monospace",
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
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
