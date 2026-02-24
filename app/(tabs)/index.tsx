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
import { trpc } from "@/lib/trpc";

export default function ClientsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Use tRPC query to fetch clients
  const { data: clients = [], refetch, isLoading } = trpc.delivery.listClients.useQuery();

  // Use tRPC mutation to delete client
  const deleteClientMutation = trpc.delivery.deleteClient.useMutation({
    onSuccess: () => {
      refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      Alert.alert("Erreur", "Impossible de supprimer le client");
      console.error("Error deleting client:", error);
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeleteClient = (client: any) => {
    Alert.alert(
      "Supprimer le client",
      `Voulez-vous vraiment supprimer ${client.name}?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteClientMutation.mutateAsync({ clientId: client.id });
          },
        },
      ]
    );
  };

  const handleClientPress = (client: any) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/client/detail",
      params: { clientId: client.id },
    });
  };

  const filteredClients = clients.filter(
    (client: any) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (client.phone?.includes(searchQuery) || false)
  );

  const renderClient = ({ item }: { item: any }) => (
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
        {/* Header */}
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

        {/* Client List */}
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
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
              <Text className="text-muted text-center text-base">
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
