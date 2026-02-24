import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Platform,
  TextInput,
  Modal,
  Keyboard,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClients, getSitesByClient, deleteSite, type Site, getEquipment, updateClientEquipment, addEquipment, type Equipment } from "@/lib/storage";

export default function ClientDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  
  const [client, setClient] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [clientEquipment, setClientEquipment] = useState<Equipment[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentCapacity, setNewEquipmentCapacity] = useState("");
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteAddress, setNewSiteAddress] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (!clientId) {
        setLoadError("Client ID not found");
        setIsLoading(false);
        return;
      }
      
      const clients = await getClients();
      const foundClient = clients.find((c) => c.id === clientId);
      
      if (!foundClient) {
        setLoadError("Client not found");
        setIsLoading(false);
        return;
      }
      
      setClient(foundClient);
      
      const sitesData = await getSitesByClient(clientId);
      setSites(sitesData);
      
      const equipment = await getEquipment();
      setAllEquipment(equipment);
      
      const clientEquipmentIds = foundClient.equipmentIds || [];
      const clientEquip = equipment.filter((eq) => clientEquipmentIds.includes(eq.id));
      setClientEquipment(clientEquip);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoadError("Error loading client data");
      setIsLoading(false);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddEquipment = async () => {
    if (!newEquipmentName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom de l'equipement");
      return;
    }

    try {
      Keyboard.dismiss();
      
      const newEquipment = await addEquipment(
        newEquipmentName.trim(),
        newEquipmentCapacity ? Number(newEquipmentCapacity) : undefined
      );

      const newIds = [...(client.equipmentIds || []), newEquipment.id];
      await updateClientEquipment(clientId || "", newIds);
      
      setNewEquipmentName("");
      setNewEquipmentCapacity("");
      setShowAddEquipmentModal(false);
      Keyboard.dismiss();
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await loadData();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter l'equipement");
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    Alert.alert(
      "Supprimer l'equipement",
      "Êtes-vous sûr de vouloir supprimer cet equipement?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const newIds = (client.equipmentIds || []).filter((id: string) => id !== equipmentId);
              await updateClientEquipment(clientId || "", newIds);
              await loadData();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'equipement");
            }
          },
        },
      ]
    );
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom du site");
      return;
    }

    try {
      const newSite: Site = {
        id: Date.now().toString(),
        clientId: clientId || "",
        name: newSiteName.trim(),
        address: newSiteAddress.trim(),
        createdAt: Date.now(),
      };

      const existingSites = await getSitesByClient(clientId || "");
      const updatedSites = [...existingSites, newSite];
      
      setNewSiteName("");
      setNewSiteAddress("");
      setShowAddSiteModal(false);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await loadData();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter le site");
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    Alert.alert(
      "Supprimer le site",
      "Êtes-vous sûr de vouloir supprimer ce site?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSite(siteId);
              await loadData();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le site");
            }
          },
        },
      ]
    );
  };

  const renderEquipment = ({ item }: { item: Equipment }) => (
    <TouchableOpacity
      onLongPress={() => handleDeleteEquipment(item.id)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{item.name}</Text>
          {item.capacity && (
            <Text className="text-muted text-sm mt-1">Capacité: {item.capacity}L</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSite = ({ item }: { item: Site }) => (
    <TouchableOpacity
      onLongPress={() => handleDeleteSite(item.id)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text className="text-foreground font-semibold">{item.name}</Text>
      {item.address && (
        <Text className="text-muted text-sm mt-1">{item.address}</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  if (loadError || !client) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-error text-lg font-semibold mb-4">Erreur</Text>
          <Text className="text-muted text-center mb-6">{loadError || "Client not found"}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text className="text-white font-semibold">Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-foreground flex-1">{client.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Client Info */}
        <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
          <Text className="text-muted text-sm mb-2">Entreprise</Text>
          <Text className="text-foreground font-semibold mb-4">{client.company || "N/A"}</Text>
          
          <Text className="text-muted text-sm mb-2">Adresse</Text>
          <Text className="text-foreground font-semibold mb-4">{client.address || "N/A"}</Text>
          
          <Text className="text-muted text-sm mb-2">Téléphone</Text>
          <Text className="text-foreground font-semibold mb-4">{client.phone || "N/A"}</Text>
          
          <Text className="text-muted text-sm mb-2">Email</Text>
          <Text className="text-foreground font-semibold">{client.email || "N/A"}</Text>
        </View>

        {/* Equipment Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground">Équipements</Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowAddEquipmentModal(true);
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
              renderItem={renderEquipment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center border border-border">
              <Text className="text-muted text-center">
                Aucun equipement pour ce client.{"\n"}Appuyez sur + pour ajouter un equipement.
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
                setShowAddSiteModal(true);
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

      {/* Equipment Modal */}
      <Modal
        visible={showAddEquipmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddEquipmentModal(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="text-2xl font-bold text-foreground mb-6">Ajouter un equipement</Text>
            
            <Text className="text-foreground font-semibold mb-2">Nom de l equipement</Text>
            <TextInput
              placeholder="Ex: Reservoir 1000L"
              placeholderTextColor={colors.muted}
              value={newEquipmentName}
              onChangeText={setNewEquipmentName}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
            />
            
            <Text className="text-foreground font-semibold mb-2">Capacite L Optionnel</Text>
            <TextInput
              placeholder="Ex: 1000"
              placeholderTextColor={colors.muted}
              value={newEquipmentCapacity}
              onChangeText={setNewEquipmentCapacity}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleAddEquipment}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
            />
            
            <View className="flex-row gap-3 pb-8">
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowAddEquipmentModal(false);
                  setNewEquipmentName("");
                  setNewEquipmentCapacity("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-foreground text-center font-semibold">Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleAddEquipment}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text className="text-white text-center font-semibold">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Site Modal */}
      <Modal
        visible={showAddSiteModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddSiteModal(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="text-2xl font-bold text-foreground mb-6">Ajouter un site</Text>
            
            <Text className="text-foreground font-semibold mb-2">Nom du site</Text>
            <TextInput
              placeholder="Ex: Entrepot Principal"
              placeholderTextColor={colors.muted}
              value={newSiteName}
              onChangeText={setNewSiteName}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
            />
            
            <Text className="text-foreground font-semibold mb-2">Adresse</Text>
            <TextInput
              placeholder="Ex: 123 Rue Principal, Montreal"
              placeholderTextColor={colors.muted}
              value={newSiteAddress}
              onChangeText={setNewSiteAddress}
              returnKeyType="done"
              onSubmitEditing={handleAddSite}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
            />
            
            <View className="flex-row gap-3 pb-8">
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowAddSiteModal(false);
                  setNewSiteName("");
                  setNewSiteAddress("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-foreground text-center font-semibold">Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleAddSite}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text className="text-white text-center font-semibold">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
