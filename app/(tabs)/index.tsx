import { useState, useCallback } from "react";
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
      "Voulez-vous vraiment supprimer " + client.name + "?",
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
      style={{ opacity: 1 }}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-lg font-semibold text-foreground flex-1">{item.name}</Text>
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
              style={{ opacity: 1 }}
              activeOpacity={0.6}
            >
              <Text className="text-primary text-sm font-medium">Modifier</Text>
            </TouchableOpacity>
          )}
        </View>
        {item.company ? (
          <Text className="text-sm text-muted mb-1">{item.company}</Text>
        ) : null}
        {item.phone ? (
          <Text className="text-sm text-muted mb-1">{item.phone}</Text>
        ) : null}
        {item.email ? (
          <Text className="text-sm text-primary">{item.email}</Text>
        ) : null}
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
          style={{ opacity: 1 }}
          activeOpacity={0.6}
          className="mt-3 bg-primary rounded-lg py-2 px-3"
        >
          <Text className="text-white text-sm font-medium text-center">
            Voir les billets
          </Text>
        </TouchableOpacity>
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
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground mb-2">Clients</Text>
          <TextInput
            className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
            placeholder="Rechercher un client..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
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
                {searchQuery
                  ? "Aucun client trouve"
                  : "Aucun client.\nAppuyez sur + pour ajouter un client."}
              </Text>
            </View>
          }
        />
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push("/client/add");
            }}
            style={{
              position: "absolute",
              right: 20,
              bottom: 20,
              backgroundColor: colors.primary,
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
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={32} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}
