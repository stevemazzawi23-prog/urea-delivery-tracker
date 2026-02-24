import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getSitesByClient, type Site } from "@/lib/storage";

export default function SelectSiteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientCompany: string;
  }>();
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    loadSites();
  }, [clientId]);

  const loadSites = async () => {
    if (clientId) {
      const clientSites = await getSitesByClient(clientId);
      setSites(clientSites.sort((a, b) => b.createdAt - a.createdAt));
    }
  };

  const handleSelectSite = (site: Site) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/delivery/active",
      params: {
        clientId,
        clientName,
        clientCompany,
        siteId: site.id,
        siteName: site.name,
      },
    });
  };

  const handleStartWithoutSite = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/delivery/active",
      params: {
        clientId,
        clientName,
        clientCompany,
        siteId: "",
        siteName: "",
      },
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
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
            <Text className="text-primary text-base font-medium">Annuler</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Client Info */}
          <View className="bg-surface rounded-2xl p-6 mb-8 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-1">{clientName}</Text>
            {clientCompany ? (
              <Text className="text-base text-muted">{clientCompany}</Text>
            ) : null}
          </View>

          {/* Instructions */}
          <Text className="text-lg font-semibold text-foreground mb-4">
            Sélectionnez un site de livraison
          </Text>

          {/* Sites List */}
          {sites.length > 0 ? (
            <View className="mb-6">
              {sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  onPress={() => handleSelectSite(site)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-base font-semibold">{site.name}</Text>
                  {site.address ? (
                    <Text className="text-white text-sm opacity-80 mt-1">{site.address}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center border border-border mb-6">
              <Text className="text-muted text-center">
                Aucun site pour ce client.{"\n"}Vous pouvez démarrer une livraison sans site.
              </Text>
            </View>
          )}

          {/* Start Without Site Option */}
          <TouchableOpacity
            onPress={handleStartWithoutSite}
            style={{
              backgroundColor: colors.surface,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text className="text-foreground text-base font-semibold">
              Démarrer sans site
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
