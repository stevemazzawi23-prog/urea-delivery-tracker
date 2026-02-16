import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDrivers, addDriver, setCurrentDriver, startShift } from "@/lib/storage";
import { useState, useEffect } from "react";

export default function SelectDriverScreen() {
  const colors = useColors();
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [newDriverName, setNewDriverName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const driversList = await getDrivers();
      setDrivers(driversList);
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriver = async (driver: any) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Set current driver
      await setCurrentDriver(driver);

      // Start shift
      await startShift(driver.id, driver.name);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Succès", `Quart de travail démarré pour ${driver.name}`);
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de démarrer le quart de travail");
    }
  };

  const handleAddDriver = async () => {
    if (!newDriverName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom du livreur");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const newDriver = await addDriver(newDriverName.trim());
      setDrivers([...drivers, newDriver]);
      setNewDriverName("");
      Alert.alert("Succès", `${newDriver.name} a été ajouté`);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter le livreur");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          Sélectionner un livreur
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          Choisissez votre nom pour démarrer votre quart de travail
        </Text>

        {/* Add New Driver */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Ajouter un nouveau livreur
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              placeholder="Nom du livreur"
              placeholderTextColor={colors.muted}
              value={newDriverName}
              onChangeText={setNewDriverName}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <TouchableOpacity
              onPress={handleAddDriver}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 10,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drivers List */}
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Livreurs existants ({drivers.length})
        </Text>

        {drivers.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Aucun livreur trouvé</Text>
          </View>
        ) : (
          <View style={{ gap: 8, marginBottom: 20 }}>
            {drivers.map((driver) => (
              <TouchableOpacity
                key={driver.id}
                onPress={() => handleSelectDriver(driver)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
                      {driver.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                      {driver.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      Cliquez pour démarrer
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
