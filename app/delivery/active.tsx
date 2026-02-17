import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { DeliveryUnit, Equipment, getEquipment } from "@/lib/storage";

export default function ActiveDeliveryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany, siteId, siteName } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientCompany: string;
    siteId: string;
    siteName: string;
  }>();

  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [units, setUnits] = useState<DeliveryUnit[]>([]);
  const [unitName, setUnitName] = useState("");
  const [unitLiters, setUnitLiters] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load equipment list on mount
  useEffect(() => {
    const loadEquipment = async () => {
      const equipmentList = await getEquipment();
      setEquipment(equipmentList);
    };
    loadEquipment();
  }, []);

  useEffect(() => {
    // Start timer
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddUnit = () => {
    if (!unitName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom de l'unité (ex: Camion 1, Réservoir A)");
      return;
    }

    if (!unitLiters.trim() || isNaN(Number(unitLiters)) || Number(unitLiters) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un nombre de litres valide.");
      return;
    }

    // Check if selected equipment has capacity limit
    const selectedEquipment = equipment.find(e => e.name === unitName.trim());
    if (selectedEquipment && selectedEquipment.capacity && Number(unitLiters) > selectedEquipment.capacity) {
      Alert.alert(
        "Capacité dépassée",
        `L'équipement "${unitName}" a une capacité de ${selectedEquipment.capacity}L, mais vous avez entré ${unitLiters}L.\n\nVoulez-vous continuer ou vérifier votre entrée?`,
        [
          {
            text: "Vérifier mon entrée",
            onPress: () => {
              // Focus on the liters input for correction
              setUnitLiters("");
            },
            style: "default"
          },
          {
            text: "Continuer quand même",
            onPress: () => {
              proceedWithAddUnit();
            },
            style: "default"
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }

    proceedWithAddUnit();
  };

  const proceedWithAddUnit = () => {

    // Check for duplicate unit name
    const existingUnit = units.find(u => u.unitName.toLowerCase() === unitName.trim().toLowerCase());
    
    if (existingUnit) {
      // Show dialog asking to merge or add new
      Alert.alert(
        "Unité déjà existante",
        `L'unité "${unitName}" existe déjà avec ${existingUnit.liters}L. Que voulez-vous faire?`,
        [
          {
            text: "Ajouter au litrage existant",
            onPress: () => {
              const updatedUnits = units.map(u => 
                u.id === existingUnit.id 
                  ? { ...u, liters: u.liters + Number(unitLiters) }
                  : u
              );
              setUnits(updatedUnits);
              setUnitName("");
              setUnitLiters("");
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }
          },
          {
            text: "Entrer un nouveau numéro d'unité",
            onPress: () => {
              // Clear the unit name to allow user to enter a different one
              setUnitName("");
            }
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newUnit: DeliveryUnit = {
      id: Date.now().toString(),
      unitName: unitName.trim(),
      liters: Number(unitLiters),
    };

    setUnits([...units, newUnit]);
    setUnitName("");
    setUnitLiters("");
  };

  const handleDeleteUnit = (unitId: string) => {
    setUnits(units.filter((u) => u.id !== unitId));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStopDelivery = async () => {
    if (units.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins une unité avant de terminer.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const endTime = Date.now();
    const totalLiters = units.reduce((sum, unit) => sum + unit.liters, 0);

    // Get current driver name
    const { getCurrentDriver } = await import("@/lib/storage");
    const currentDriver = await getCurrentDriver();
    const driverName = currentDriver?.name || "Non spécifié";

    router.replace({
      pathname: "/delivery/summary",
      params: {
        clientId,
        clientName,
        clientCompany,
        siteId,
        driverName,
        siteName,
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        litersDelivered: totalLiters.toString(),
        unitsJson: JSON.stringify(units),
        photosJson: JSON.stringify(photos),
      },
    });
  };

  const handleCapturePhoto = () => {
    router.push({
      pathname: "/delivery/capture-photo",
      params: {
        returnPath: "/delivery/active",
        clientId,
        clientName,
        clientCompany,
        siteId,
        siteName,
        photosJson: JSON.stringify(photos),
      },
    });
  };

  const totalLiters = units.reduce((sum, unit) => sum + unit.liters, 0);

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header with Timer */}
        <View style={{ backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
            {formatDateTime(startTime)}
          </Text>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.foreground }}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>

        {/* Client & Site Info */}
        <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 }}>
          <View>
            <Text style={{ fontSize: 12, color: colors.muted }}>Client</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {clientName} {clientCompany && `(${clientCompany})`}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: colors.muted }}>Site</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {siteName}
            </Text>
          </View>
        </View>

        {/* Add Unit Section */}
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
            Ajouter une unité
          </Text>

          {/* Equipment Dropdown Button */}
          <TouchableOpacity
            onPress={() => setShowEquipmentDropdown(true)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              backgroundColor: colors.surface,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: unitName ? colors.foreground : colors.muted }}>
              {unitName || "Sélectionner un équipement..."}
            </Text>
          </TouchableOpacity>

          {/* Equipment Dropdown Modal */}
          <Modal
            visible={showEquipmentDropdown}
            transparent
            animationType="slide"
            onRequestClose={() => setShowEquipmentDropdown(false)}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
              <View
                style={{
                  backgroundColor: colors.background,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 16,
                  maxHeight: "70%",
                }}
              >
                <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>Sélectionner un équipement</Text>
                </View>
                <FlatList
                  data={equipment}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setUnitName(item.name);
                        setShowEquipmentDropdown(false);
                      }}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 16, color: colors.foreground }}>{item.name}</Text>
                      {item.capacity && (
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Capacité: {item.capacity}L</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{ padding: 16, alignItems: "center" }}>
                      <Text style={{ color: colors.muted }}>Aucun équipement disponible</Text>
                    </View>
                  }
                />
                <TouchableOpacity
                  onPress={() => setShowEquipmentDropdown(false)}
                  style={{
                    padding: 16,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Manual Unit Name Input */}
          <TextInput
            placeholder="Ou entrer un nom personnalisé"
            value={unitName}
            onChangeText={setUnitName}
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
            placeholder="Litres livrés"
            value={unitLiters}
            onChangeText={setUnitLiters}
            keyboardType="decimal-pad"
            returnKeyType="done"
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
            onPress={handleAddUnit}
            style={{
              backgroundColor: "#1B5E20",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              + Ajouter l'unité
            </Text>
          </TouchableOpacity>
        </View>

        {/* Units List */}
        {units.length > 0 && (
          <View style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
                Unités ({units.length})
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1B5E20" }}>
                Total: {totalLiters}L
              </Text>
            </View>

            {units.map((unit) => (
              <View
                key={unit.id}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {unit.unitName}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    {unit.liters} litres
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteUnit(unit.id)}
                  style={{
                    backgroundColor: "#EF4444",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 6,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Photos Section */}
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
              Photos ({photos.length})
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCapturePhoto}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: 10,
              paddingVertical: 16,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
              📷 Ajouter une photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={{ padding: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={handleStopDelivery}
            style={{
              backgroundColor: "#1B5E20",
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              ✓ Terminer la livraison
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
