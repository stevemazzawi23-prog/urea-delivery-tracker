import { View, Text, TouchableOpacity, ScrollView, Platform, TextInput, FlatList, Alert } from "react-native";
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
      const clientsList = await getClients();
      setClients(clientsList.sort((a, b) => b.createdAt - a.createdAt));
      setFilteredClients(clientsList.sort((a, b) => b.createdAt - a.createdAt));
      
      // Load delivery history for each client
      const history: Record<string, Delivery[]> = {};
      for (const client of clientsList) {
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
        clientCompany: client.company,
      },
    });
  };

  const renderClientItem = ({ item }: { item: Client }) => {
    const deliveries = deliveryHistory[item.id] || [];
    const lastDelivery = deliveries.length > 0 ? deliveries[0] : null;
    const lastDeliveryDate = lastDelivery ? new Date(lastDelivery.createdAt).toLocaleDateString("fr-CA") : null;
    const totalLiters = deliveries.reduce((sum, d) => sum + d.litersDelivered, 0);
    
    return (
      <TouchableOpacity
        onPress={() => handleSelectClient(item)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          {item.name}
        </Text>
        {item.company && (
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
            {item.company}
          </Text>
        )}
        {item.address && (
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
            📍 {item.address}
          </Text>
        )}
        
        {/* Delivery History */}
        <View style={{ 
          borderTopWidth: 1, 
          borderTopColor: colors.border, 
          paddingTop: 12, 
          marginTop: 8 
        }}>
          {deliveries.length > 0 ? (
            <>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                📦 Historique ({deliveries.length})
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
                Dernière livraison: {lastDeliveryDate}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                Total: {totalLiters} L
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 11, color: colors.muted, fontStyle: "italic" }}>
              Aucune livraison précédente
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
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
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "500" }}>Annuler</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
          {/* Title */}
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 4 }}>
            Sélectionner un client
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
            Choisissez le client pour cette livraison
          </Text>

          {/* Search Bar */}
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.foreground,
              fontSize: 14,
            }}
            placeholder="Rechercher un client..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={handleSearch}
          />

          {/* Clients List */}
          {loading ? (
            <Text style={{ textAlign: "center", color: colors.muted, marginTop: 20 }}>
              Chargement des clients...
            </Text>
          ) : filteredClients.length > 0 ? (
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ fontSize: 16, color: colors.muted, marginBottom: 8 }}>
                {searchQuery ? "Aucun client trouvé" : "Aucun client disponible"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {searchQuery ? "Essayez une autre recherche" : "Ajoutez un client pour commencer"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
