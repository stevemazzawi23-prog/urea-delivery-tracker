import { useState, useCallback } from "react";
import { useSocket } from "@/hooks/use-socket";
import {
  View,
  Text,
  TextInput,
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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { getClients, deleteClient, Client } from "@/lib/storage";

export default function ClientsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ── Real-time sync: reload when another device adds/edits/deletes a client ──
  useSocket(user?.id, {
    onClientsUpdated: () => loadClients(),
    onSitesUpdated: () => loadClients(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      "Supprimer le client",
      `Voulez-vous vraiment supprimer ${client.name}?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClient(client.id);
              await loadClients();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le client");
            }
          },
        },
      ]
    );
  };

  const handleClientPress = (client: Client) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/client/detail",
      params: { clientId: client.id },
    });
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (client.phone?.includes(searchQuery) || false)
  );

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      onPress={() => handleClientPress(item)}
      onLongPress={() => isAdmin && handleDeleteClient(item)}
      activeOpacity={0.7}
      style={[styles.clientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.clientHeader}>
        <Text style={[styles.clientName, { color: colors.foreground }]}>{item.name}</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: "/client/edit",
                params: { clientId: item.id },
              });
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.editButton, { color: colors.primary }]}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
      {item.company ? (
        <Text style={[styles.clientInfo, { color: colors.muted }]}>{item.company}</Text>
      ) : null}
      {item.phone ? (
        <Text style={[styles.clientInfo, { color: colors.muted }]}>{item.phone}</Text>
      ) : null}
      {item.email ? (
        <Text style={[styles.clientEmail, { color: colors.primary }]}>{item.email}</Text>
      ) : null}

      {/* View Delivery History Button */}
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push({
            pathname: "/client/delivery-history",
            params: { clientId: item.id, clientName: item.name },
          });
        }}
        activeOpacity={0.6}
        style={[styles.historyButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.historyButtonText}>Voir les billets</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>Clients</Text>
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
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Client List */}
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {searchQuery
                  ? "Aucun client trouvé"
                  : "Aucun client.\nAppuyez sur + pour ajouter un client."}
              </Text>
            </View>
          }
        />

        {/* Floating Add Button - Admin Only */}
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push("/client/add");
            }}
            style={[styles.fab, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={32} color="#ffffff" />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  clientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  editButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  clientInfo: {
    fontSize: 13,
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  historyButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  historyButtonText: {
    color: "#ffffff",
    fontSize: 13,
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
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    right: 4,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
