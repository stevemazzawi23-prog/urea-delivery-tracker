import { ScrollView, Text, View, TouchableOpacity, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDeliveries, getClients, getInvoices } from "@/lib/storage";
import { useState, useEffect } from "react";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [stats, setStats] = useState({
    deliveriesToday: 0,
    totalLitersToday: 0,
    totalInvoices: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

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

  const handleNavigation = (route: any) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route);
  };

  const ActionButton = ({
    title,
    description,
    icon,
    onPress,
    color,
  }: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: color,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Text style={{ fontSize: 32 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}>
        {/* Logo Section */}
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 32 }}>
          <Image
            source={require("@/assets/images/sp-logistix-logo-home.png")}
            style={{ width: 120, height: 120, resizeMode: "contain" }}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.foreground,
              marginTop: 12,
            }}
          >
            SP Logistix
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginTop: 4,
            }}
          >
            Gestion des livraisons d'urée
          </Text>
        </View>

        {/* Stats Section */}
        <View style={{ marginBottom: 24, gap: 12 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {stats.deliveriesToday}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                Livraisons
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {stats.totalLitersToday}L
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                Litres
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {stats.totalInvoices}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                Factures
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Actions principales
          </Text>

          <ActionButton
            title="Démarrer une livraison"
            description="Sélectionnez un client et commencez"
            icon="🚚"
            onPress={() => handleNavigation("/(tabs)")}
            color="#1B7F3D"
          />

          <ActionButton
            title="Consulter les factures"
            description="Voir toutes les factures générées"
            icon="📄"
            onPress={() => handleNavigation("/(tabs)/history")}
            color="#2A9F54"
          />

          <ActionButton
            title="Banque de clients"
            description="Gérer vos clients et leurs sites"
            icon="👥"
            onPress={() => handleNavigation("/(tabs)")}
            color="#3DB867"
          />
        </View>

        {/* Quick Links */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Autres
          </Text>

          <TouchableOpacity
            onPress={() => handleNavigation("/(tabs)/website")}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 20 }}>ℹ️</Text>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  À propos
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Informations sur SP Logistix
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 18, color: colors.muted }}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
