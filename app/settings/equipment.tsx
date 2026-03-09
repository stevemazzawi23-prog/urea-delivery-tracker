import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Platform,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Equipment, getEquipment, addEquipment, deleteEquipment } from "@/lib/storage";
import * as Haptics from "expo-haptics";

export default function EquipmentManagementScreen() {
  const colors = useColors();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentCapacity, setNewEquipmentCapacity] = useState("");

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    const list = await getEquipment();
    setEquipment(list);
  };

  const handleAddEquipment = async () => {
    if (!newEquipmentName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom de l'équipement");
      return;
    }

    try {
      const capacity = newEquipmentCapacity ? Number(newEquipmentCapacity) : undefined;
      await addEquipment(newEquipmentName.trim(), capacity);
      setNewEquipmentName("");
      setNewEquipmentCapacity("");
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await loadEquipment();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter l'équipement");
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    Alert.alert(
      "Supprimer l'équipement",
      "Êtes-vous sûr?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEquipment(equipmentId);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              await loadEquipment();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'équipement");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Add Equipment Section */}
      <View style={{ marginBottom: 24, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
          Ajouter un équipement
        </Text>

        <TextInput
          placeholder="Nom de l'équipement (ex: Camion 1, Réservoir A)"
          value={newEquipmentName}
          onChangeText={setNewEquipmentName}
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            color: colors.foreground,
            backgroundColor: colors.surface,
          }}
          placeholderTextColor={colors.muted}
        />

        <TextInput
          placeholder="Capacité (litres) - Optionnel"
          value={newEquipmentCapacity}
          onChangeText={setNewEquipmentCapacity}
          keyboardType="decimal-pad"
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            color: colors.foreground,
            backgroundColor: colors.surface,
          }}
          placeholderTextColor={colors.muted}
        />

        <TouchableOpacity
          onPress={handleAddEquipment}
          style={{
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.background, fontWeight: "600" }}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Equipment List */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
          Équipements ({equipment.length})
        </Text>

        <FlatList
          data={equipment}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {item.name}
                </Text>
                {item.capacity && (
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Capacité: {item.capacity}L
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteEquipment(item.id)}
                style={{
                  padding: 8,
                  marginLeft: 12,
                }}
              >
                <Text style={{ fontSize: 18, color: colors.error }}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text style={{ color: colors.muted }}>Aucun équipement enregistré</Text>
            </View>
          }
        />
      </View>
      </ScrollView>
    </ScreenContainer>
  );
}
