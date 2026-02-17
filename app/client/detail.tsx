import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClients, getSitesByClient, deleteSite, type Site, getEquipment, getClientEquipment, updateClientEquipment, type Equipment } from "@/lib/storage";

export default function ClientDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [client, setClient] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [clientEquipment, setClientEquipment] = useState<Equipment[]>([]);

  const loadData = async () => {
    const clients = await getClients();
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClient(found);
    }

    const clientSites = await getSitesByClient(clientId || "");
    setSites(clientSites.sort((a, b) => b.createdAt - a.createdAt));

    const equipment = await getEquipment();
    setAllEquipment(equipment);

    const assigned = await getClientEquipment(clientId || "");
    setClientEquipment(assigned);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [clientId])
  );

  const handleDeleteSite = (site: Site) => {
    Alert.alert(
      "Supprimer le site",
      `Voulez-vous vraiment supprimer ${site.name}?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteSite(site.id);
            await loadData();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const renderSite = ({ item }: { item: Site }) => (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push({
          pathname: "/site/edit",
          params: { siteId: item.id },
        });
      }}
      onLongPress={() => handleDeleteSite(item)}
      style={{ opacity: 1 }}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground mb-1">{item.name}</Text>
            {item.address ? (
              <Text className="text-sm text-muted">{item.address}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: "/site/edit",
                params: { siteId: item.id },
              });
            }}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text className="text-primary text-sm font-medium">Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!client) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text className="text-primary text-base font-medium">Retour</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Détails Client</Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: "/client/edit",
                params: { clientId },
              });
            }}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text className="text-primary text-base font-medium">Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 pt-6">
          {/* Client Info */}
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-1">{client.name}</Text>
            {client.company ? (
              <Text className="text-base text-muted mb-2">{client.company}</Text>
            ) : null}
            {client.phone ? (
              <Text className="text-base text-muted mb-2">{client.phone}</Text>
            ) : null}
            {client.address ? (
              <Text className="text-base text-muted mb-2">{client.address}</Text>
            ) : null}
            {client.notes ? (
              <View className="mt-3 pt-3 border-t border-border">
                <Text className="text-sm text-muted mb-1">Notes</Text>
                <Text className="text-base text-foreground">{client.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Start Delivery Button */}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: "/delivery/select-site",
                params: {
                  clientId,
                  clientName: client.name,
                  clientCompany: client.company,
                },
              });
            }}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 6,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">Démarrer une livraison</Text>
          </TouchableOpacity>

          {/* Equipment Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-foreground">Équipements</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log("Add equipment button pressed");
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  const options = allEquipment.map((eq) => ({
                    text: eq.name,
                    onPress: async () => {
                      console.log("Selected equipment:", eq.name);
                      const newIds = [...(client.equipmentIds || []), eq.id];
                      const uniqueIds = [...new Set(newIds)];
                      await updateClientEquipment(clientId || "", uniqueIds);
                      await loadData();
                      if (Platform.OS !== "web") {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                    },
                  }));
                  
                  Alert.alert(
                    "Ajouter des équipements",
                    "Sélectionnez les équipements pour ce client",
                    [
                      ...options,
                      { text: "Annuler", style: "cancel" },
                    ]
                  );
                }}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm font-semibold">+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {clientEquipment.length > 0 ? (
              <FlatList
                data={clientEquipment}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onLongPress={() => {
                      Alert.alert(
                        "Supprimer l'équipement",
                        `Retirer ${item.name}?`,
                        [
                          { text: "Annuler", style: "cancel" },
                          {
                            text: "Supprimer",
                            style: "destructive",
                            onPress: async () => {
                              const newIds = (client.equipmentIds || []).filter((id: string) => id !== item.id);
                              await updateClientEquipment(clientId || "", newIds);
                              await loadData();
                              if (Platform.OS !== "web") {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              }
                            },
                          },
                        ]
                      );
                    }}
                    style={{ opacity: 1 }}
                    activeOpacity={0.7}
                  >
                    <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
                      <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
                      {item.capacity && (
                        <Text className="text-sm text-muted mt-1">Capacité: {item.capacity}L</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-muted text-center">
                  Aucun équipement assigné.{"\n"}Appuyez sur + pour ajouter.
                </Text>
              </View>
            )}
          </View>

          {/* Sites Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-foreground">Sites de livraison</Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push({
                    pathname: "/site/add",
                    params: { clientId },
                  });
                }}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm font-semibold">+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {sites.length > 0 ? (
              <FlatList
                data={sites}
                renderItem={renderSite}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-muted text-center">
                  Aucun site pour ce client.{"\n"}Appuyez sur + pour ajouter un site.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
