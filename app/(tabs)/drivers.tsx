import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Modal, KeyboardAvoidingView } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { Platform } from "react-native";

type ModalMode = "create" | "edit" | null;

export default function DriversScreen() {
  const colors = useColors();
  const { user, users, createUser, updateUser, deleteUser, refreshUsers } = useAuth();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/(tabs)/home');
    }
  }, [user, router]);

  if (user?.role !== 'admin') {
    return null;
  }

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "", role: "driver" as UserRole });
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUsers();
    }, [])
  );

  // Filter to show only drivers (admins can manage all drivers)
  const drivers = users.filter((u) => u.role === "driver");

  const handleOpenCreateModal = () => {
    setFormData({ username: "", password: "", role: "driver" as UserRole });
    setEditingUserId(null);
    setModalMode("create");
  };

  const handleOpenEditModal = (driverId: string) => {
    const driver = users.find((u) => u.id === driverId) as any;
    if (driver) {
      setFormData({
        username: driver.username,
        password: driver.password || "",
        role: driver.role,
      });
      setEditingUserId(driverId);
      setModalMode("edit");
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingUserId(null);
    setFormData({ username: "", password: "", role: "driver" });
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      let success = false;
      if (modalMode === "create") {
        success = await createUser(formData.username, formData.password, formData.role);
        if (success) {
          Alert.alert("Succès", "Chauffeur créé avec succès");
        } else {
          Alert.alert("Erreur", "Ce nom d'utilisateur existe déjà");
        }
      } else if (modalMode === "edit" && editingUserId) {
        success = await updateUser(editingUserId, formData.username, formData.password, formData.role);
        if (success) {
          Alert.alert("Succès", "Chauffeur modifié avec succès");
        } else {
          Alert.alert("Erreur", "Impossible de modifier le chauffeur");
        }
      }

      if (success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        handleCloseModal();
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error saving driver:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (driverId: string, driverName: string) => {
    Alert.alert(
      "Supprimer le chauffeur",
      `Êtes-vous sûr de vouloir supprimer ${driverName}?`,
      [
        { text: "Annuler", onPress: () => {} },
        {
          text: "Supprimer",
          onPress: async () => {
            try {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              const success = await deleteUser(driverId);
              if (success) {
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert("Succès", "Chauffeur supprimé avec succès");
                await refreshUsers();
              } else {
                Alert.alert("Erreur", "Impossible de supprimer le chauffeur");
              }
            } catch (error) {
              console.error("Error deleting driver:", error);
              Alert.alert("Erreur", "Une erreur est survenue");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Only admins can access this screen
  if (user?.role !== "admin") {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg font-semibold text-error">Accès refusé</Text>
          <Text className="text-sm text-muted mt-2">Seuls les administrateurs peuvent gérer les chauffeurs</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View>
            <Text className="text-2xl font-bold text-foreground">Gestion des chauffeurs</Text>
            <Text className="text-sm text-muted mt-1">{drivers.length} chauffeur(s)</Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Drivers List */}
        {drivers.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text className="text-lg text-muted">Aucun chauffeur</Text>
            <Text className="text-sm text-muted mt-2">Appuyez sur "+ Ajouter" pour créer un nouveau chauffeur</Text>
          </View>
        ) : (
          <View className="gap-3">
            {drivers.map((driver) => (
              <View
                key={driver.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                      {driver.username}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      Rôle: <Text style={{ fontWeight: "600" }}>{driver.role}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(driver.id)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 6,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(driver.id, driver.username)}
                      style={{
                        backgroundColor: colors.error,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 6,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal for Create/Edit */}
      <Modal visible={modalMode !== null} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              minHeight: 350,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
                {modalMode === "create" ? "Ajouter un chauffeur" : "Modifier le chauffeur"}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="gap-4 mb-6">
              {/* Username */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                  Nom d'utilisateur
                </Text>
                <TextInput
                  placeholder="Entrez le nom d'utilisateur"
                  placeholderTextColor={colors.muted}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  editable={!isLoading}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                  Mot de passe
                </Text>
                <TextInput
                  placeholder="Entrez le mot de passe"
                  placeholderTextColor={colors.muted}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  editable={!isLoading}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleCloseModal}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  opacity: isLoading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: isLoading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {isLoading ? "..." : modalMode === "create" ? "Créer" : "Modifier"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
