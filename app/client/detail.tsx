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
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getClients,
  getSitesByClient,
  saveSite,
  deleteSite,
  type Site,
  getEquipment,
  updateClientEquipment,
  addEquipment,
  type Equipment,
} from "@/lib/storage";

export default function ClientDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string }>();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;

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
        setLoadError("Client ID manquant");
        setIsLoading(false);
        return;
      }

      const clients = await getClients();
      const foundClient = clients.find((c) => c.id === clientId);

      if (!foundClient) {
        setLoadError("Client introuvable");
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
      setLoadError("Erreur lors du chargement");
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
      "Etes-vous sur de vouloir supprimer cet equipement?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const newIds = (client.equipmentIds || []).filter(
                (id: string) => id !== equipmentId
              );
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
      Keyboard.dismiss();

      const savedSite = await saveSite({
        clientId: clientId || "",
        name: newSiteName.trim(),
        address: newSiteAddress.trim(),
      });

      console.log("Site saved:", savedSite);

      setNewSiteName("");
      setNewSiteAddress("");
      setShowAddSiteModal(false);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await loadData();
    } catch (error) {
      console.error("Error saving site:", error);
      Alert.alert("Erreur", "Impossible d'ajouter le site: " + String(error));
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    Alert.alert(
      "Supprimer le site",
      "Etes-vous sur de vouloir supprimer ce site?",
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

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (loadError || !client) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>Erreur</Text>
          <Text style={[styles.errorText, { color: colors.muted }]}>
            {loadError || "Client introuvable"}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Text style={[styles.backArrowText, { color: colors.primary }]}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.clientTitle, { color: colors.foreground }]} numberOfLines={1}>
            {client.name}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Client Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Entreprise</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {client.company || "N/A"}
              </Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Adresse</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {client.address || "N/A"}
              </Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Telephone</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {client.phone || "N/A"}
              </Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {client.email || "N/A"}
              </Text>
            </View>
          </View>

          {/* Equipment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Equipements</Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowAddEquipmentModal(true);
                }}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {clientEquipment.length > 0 ? (
              clientEquipment.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onLongPress={() => handleDeleteEquipment(item.id)}
                  style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.listItemRow}>
                    <View style={styles.listItemContent}>
                      <Text style={[styles.listItemTitle, { color: colors.foreground }]}>
                        {item.name}
                      </Text>
                      {item.capacity ? (
                        <Text style={[styles.listItemSubtitle, { color: colors.muted }]}>
                          Capacite: {item.capacity}L
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Aucun equipement.{"\n"}Appuyez sur + pour ajouter.
                </Text>
              </View>
            )}
          </View>

          {/* Sites Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Sites de livraison
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowAddSiteModal(true);
                }}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {sites.length > 0 ? (
              sites.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onLongPress={() => handleDeleteSite(item.id)}
                  style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.listItemTitle, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  {item.address ? (
                    <Text style={[styles.listItemSubtitle, { color: colors.muted }]}>
                      {item.address}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Aucun site de livraison.{"\n"}Appuyez sur + pour ajouter.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

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
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Ajouter un equipement
            </Text>

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Nom de l'equipement
            </Text>
            <TextInput
              placeholder="Ex: Reservoir 1000L"
              placeholderTextColor={colors.muted}
              value={newEquipmentName}
              onChangeText={setNewEquipmentName}
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
            />

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Capacite en litres (optionnel)
            </Text>
            <TextInput
              placeholder="Ex: 1000"
              placeholderTextColor={colors.muted}
              value={newEquipmentCapacity}
              onChangeText={setNewEquipmentCapacity}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleAddEquipment}
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowAddEquipmentModal(false);
                  setNewEquipmentName("");
                  setNewEquipmentCapacity("");
                }}
                style={[styles.cancelBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddEquipment}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.confirmBtnText}>Ajouter</Text>
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
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Ajouter un site de livraison
            </Text>

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nom du site *</Text>
            <TextInput
              placeholder="Ex: Entrepot Principal"
              placeholderTextColor={colors.muted}
              value={newSiteName}
              onChangeText={setNewSiteName}
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
            />

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Adresse (optionnel)
            </Text>
            <TextInput
              placeholder="Ex: 123 Rue Principal, Montreal"
              placeholderTextColor={colors.muted}
              value={newSiteAddress}
              onChangeText={setNewSiteAddress}
              returnKeyType="done"
              onSubmitEditing={handleAddSite}
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowAddSiteModal(false);
                  setNewSiteName("");
                  setNewSiteAddress("");
                }}
                style={[styles.cancelBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddSite}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.confirmBtnText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backArrow: {
    paddingRight: 8,
  },
  backArrowText: {
    fontSize: 16,
    fontWeight: "500",
  },
  clientTitle: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  infoRow: {
    padding: 14,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoDivider: {
    height: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  listItem: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  listItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 32,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: {
    fontWeight: "600",
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
