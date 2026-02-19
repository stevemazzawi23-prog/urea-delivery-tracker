import { View, Text, TouchableOpacity, ScrollView, Platform, Image, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, getInvoices, getCurrentDriver, getActiveShift, endShift, setCurrentDriver } from "@/lib/storage";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    deliveriesToday: 0,
    totalLitersToday: 0,
    totalInvoices: 0,
  });
  const [currentDriver, setCurrentDriver] = useState<any>(null);
  const [shiftTime, setShiftTime] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadDriver();
    }, [])
  );

  useEffect(() => {
    // Update shift time every second
    const interval = setInterval(async () => {
      if (currentDriver) {
        const shift = await getActiveShift(currentDriver.id);
        if (shift) {
          const elapsed = Math.floor((Date.now() - shift.startTime) / 1000);
          setShiftTime(elapsed);
        } else {
          setShiftTime(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentDriver]);

  const loadDriver = async () => {
    try {
      const driver = await getCurrentDriver();
      setCurrentDriver(driver);
    } catch (error) {
      console.error("Error loading driver:", error);
    }
  };

  const loadStats = async () => {
    try {
      const deliveries = await getDeliveries();
      const invoices = await getInvoices();

      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayDeliveries = deliveries.filter((d) => {
        const deliveryDate = new Date(d.startTime);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate.getTime() === today.getTime();
      });

      const totalLitersToday = todayDeliveries.reduce((sum, d) => {
        const unitLiters = d.units?.reduce((unitSum, u) => unitSum + u.liters, 0) || 0;
        return sum + unitLiters;
      }, 0);

      setStats({
        deliveriesToday: todayDeliveries.length,
        totalLitersToday,
        totalInvoices: invoices.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSelectDriver = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/driver/select");
  };

  const handleEndShift = async () => {
    if (!currentDriver) return;

    Alert.alert("Terminer le quart", `Êtes-vous sûr de vouloir terminer le quart de ${currentDriver.name}?`, [
      { text: "Annuler", onPress: () => {} },
      {
        text: "Terminer",
        onPress: async () => {
          try {
            await endShift(currentDriver.id);
            await setCurrentDriver(null);
            setCurrentDriver(null);
            setShiftTime(0);
            setStats({
              deliveriesToday: 0,
              totalLitersToday: 0,
              totalInvoices: 0,
            });
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Succès", "Quart de travail terminé");
          } catch (error) {
            Alert.alert("Erreur", "Impossible de terminer le quart");
          }
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNavigation = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter?",
      [
        { text: "Annuler", onPress: () => {} },
        {
          text: "Déconnecter",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        {/* User Info and Logout */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 12, color: colors.muted }}>Connecté en tant que</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, textTransform: "capitalize" }}>
              {user?.username} ({user?.role})
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: colors.error,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>Déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image
            source={require("@/assets/images/sp-logistix-logo.png")}
            style={{ width: 120, height: 120, resizeMode: "contain" }}
          />
        </View>

        {/* Driver Section */}
        {currentDriver ? (
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Livreur actif</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>{currentDriver.name}</Text>
              </View>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>
                  {currentDriver.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>



            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={handleSelectDriver}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Changer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEndShift}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSelectDriver}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 8 }}>
              Sélectionner un livreur
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Cliquez pour démarrer votre quart de travail
            </Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Livraisons</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              {stats.deliveriesToday}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Litres</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              {stats.totalLitersToday}L
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Factures</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              {stats.totalInvoices}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Actions rapides
        </Text>


        <TouchableOpacity
          onPress={() => handleNavigation("/delivery/select-client")}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          activeOpacity={0.7}
        >
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Démarrer une livraison</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Nouvelle livraison</Text>
          </View>
          <Text style={{ fontSize: 20, color: "#fff" }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleNavigation("/(tabs)/history")}
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
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>Historique & Factures</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Consulter vos livraisons</Text>
          </View>
          <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
