import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Platform, StyleSheet } from "react-native";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, [clientId]);

  const loadSites = async () => {
    try {
      setLoading(true);
      if (clientId) {
        const clientSites = await getSitesByClient(clientId);
        setSites(clientSites.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error("Error loading sites:", error);
    } finally {
      setLoading(false);
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
        clientCompany: clientCompany || "",
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
        clientCompany: clientCompany || "",
        siteId: "",
        siteName: "",
      },
    });
  };

  const renderSiteItem = ({ item }: { item: Site }) => (
    <TouchableOpacity
      onPress={() => handleSelectSite(item)}
      style={[styles.siteButton, { backgroundColor: colors.primary }]}
      activeOpacity={0.8}
    >
      <Text style={styles.siteButtonText}>{item.name}</Text>
      {item.address ? (
        <Text style={styles.siteButtonSubtext}>{item.address}</Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Client Info Card */}
      <View style={[styles.clientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.clientName, { color: colors.foreground }]}>{clientName}</Text>
        {clientCompany ? (
          <Text style={[styles.clientCompany, { color: colors.muted }]}>{clientCompany}</Text>
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Sélectionnez un site de livraison
      </Text>

      {loading ? (
        <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement des sites...</Text>
      ) : sites.length === 0 ? (
        <View style={[styles.emptySites, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptySitesText, { color: colors.muted }]}>
            Aucun site pour ce client.{"\n"}Vous pouvez démarrer une livraison sans site.
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity
      onPress={handleStartWithoutSite}
      style={[styles.noSiteButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.noSiteButtonText, { color: colors.foreground }]}>
        Démarrer sans site
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
          activeOpacity={0.6}
        >
          <Text style={[styles.cancelButton, { color: colors.primary }]}>Annuler</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList handles all scrolling */}
      <FlatList
        data={loading ? [] : sites}
        renderItem={renderSiteItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  clientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  clientName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
  },
  siteButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  siteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  siteButtonSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  emptySites: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  emptySitesText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },
  noSiteButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8,
  },
  noSiteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 20,
  },
});
