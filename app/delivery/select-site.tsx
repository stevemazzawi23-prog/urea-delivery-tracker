/**
 * select-site.tsx
 * Écran de sélection du site de livraison
 * 
 * Charge les sites depuis le portail SP Logistix en temps réel.
 * Permet aussi d'ajouter un nouveau site directement depuis l'APK.
 * 
 * Usage :
 *   router.push({
 *     pathname: "/delivery/select-site",
 *     params: { clientCode: "TLR001", clientName: "Transport Laval" }
 *   });
 * 
 * Retour (via router.back() avec setSelectedSite) :
 *   { siteName: "430 rue Isabey, Montréal" }
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator, RefreshControl, Modal, Platform, StyleSheet
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getPortalSites, addPortalSite, PortalSite } from "@/lib/portal-sites";

export default function SelectSiteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany, clientPortalCode } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientCompany?: string;
    clientPortalCode?: string;
  }>();
  // Alias pour compatibilité avec le reste du code
  const clientCode = clientPortalCode || "";

  const [sites, setSites] = useState<PortalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal d'ajout de site
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteAddress, setNewSiteAddress] = useState("");
  const [newSiteCity, setNewSiteCity] = useState("");
  const [newSiteProvince, setNewSiteProvince] = useState("QC");
  const [addingsite, setAddingSite] = useState(false);

  const loadSites = useCallback(async (isRefresh = false) => {
    if (!clientCode) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await getPortalSites(clientCode);

    if (result.success) {
      setSites(result.sites.filter(s => s.isActive === 1));
      setFromCache(!!result.fromCache);
    } else {
      setError(result.error || "Impossible de charger les sites");
      setSites([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [clientCode]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleSelectSite = (site: PortalSite) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const fullName = [site.name, site.address, site.city].filter(Boolean).join(" — ");
    router.push({
      pathname: "/delivery/active",
      params: {
        clientId: clientId || "",
        clientName: clientName || "",
        clientCompany: clientCompany || "",
        siteId: String(site.id),
        siteName: fullName,
        clientPortalCode: clientPortalCode || "",
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
        clientId: clientId || "",
        clientName: clientName || "",
        clientCompany: clientCompany || "",
        siteId: "",
        siteName: "",
        clientPortalCode: clientPortalCode || "",
      },
    });
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) {
      Alert.alert("Erreur", "Le nom du site est requis.");
      return;
    }
    if (!clientCode) return;

    setAddingSite(true);
    const result = await addPortalSite(clientCode, {
      name: newSiteName.trim(),
      address: newSiteAddress.trim() || undefined,
      city: newSiteCity.trim() || undefined,
      province: newSiteProvince.trim() || undefined,
    });

    if (result.success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setAddModalVisible(false);
      setNewSiteName("");
      setNewSiteAddress("");
      setNewSiteCity("");
      setNewSiteProvince("QC");
      // Recharger les sites
      await loadSites(true);
      Alert.alert("Succès", `Site "${newSiteName}" ajouté et synchronisé avec le portail.`);
    } else {
      Alert.alert("Erreur", result.error || "Impossible d'ajouter le site.");
    }
    setAddingSite(false);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Annuler</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Site de livraison</Text>
          {clientName && (
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{clientName}</Text>
          )}
          {clientPortalCode && (
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Code: {clientPortalCode}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} activeOpacity={0.6}>
          <Text style={[styles.addText, { color: colors.primary }]}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Cache warning */}
      {fromCache && (
        <View style={[styles.cacheBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cacheText, { color: colors.muted }]}>
            ⚠️ Données hors-ligne (dernière synchronisation)
          </Text>
          <TouchableOpacity onPress={() => loadSites(true)}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton démarrer sans site */}
      {!loading && (
        <TouchableOpacity
          onPress={handleStartWithoutSite}
          style={[{ marginHorizontal: 16, marginTop: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" }, { borderColor: colors.border, backgroundColor: colors.surface }]}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "500" }}>Démarrer sans site</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement des sites...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📡</Text>
          <Text style={[styles.errorText, { color: colors.foreground }]}>Impossible de charger les sites</Text>
          <Text style={[styles.errorSubText, { color: colors.muted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => loadSites()}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSites(true)} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {sites.length === 0 ? (
            <View style={styles.centered}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📍</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun site configuré</Text>
              <Text style={[styles.emptySubText, { color: colors.muted }]}>
                Ajoutez des sites de livraison depuis le portail SP Logistix ou appuyez sur "+ Ajouter".
              </Text>
            </View>
          ) : (
            <View style={{ padding: 16, gap: 10 }}>
              {sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  style={[styles.siteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleSelectSite(site)}
                  activeOpacity={0.7}
                >
                  <View style={styles.siteCardContent}>
                    <View style={[styles.siteIcon, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={{ fontSize: 18 }}>📍</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.siteName, { color: colors.foreground }]}>{site.name}</Text>
                      {(site.address || site.city) && (
                        <Text style={[styles.siteAddress, { color: colors.muted }]}>
                          {[site.address, site.city, site.province].filter(Boolean).join(", ")}
                        </Text>
                      )}
                      {site.notes && (
                        <Text style={[styles.siteNotes, { color: colors.muted }]}>{site.notes}</Text>
                      )}
                    </View>
                    <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal d'ajout de site */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={[styles.cancelText, { color: colors.muted }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nouveau site</Text>
            <TouchableOpacity onPress={handleAddSite} disabled={addingsite}>
              {addingsite ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.saveText, { color: colors.primary }]}>Ajouter</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.primary + "40" }]}>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                🔗 Ce site sera automatiquement synchronisé avec le portail SP Logistix et visible par tous les livreurs.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Nom du site *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.primary, color: colors.foreground }]}
                placeholder="Ex: Entrepôt principal, Bureau Laval..."
                placeholderTextColor={colors.muted}
                value={newSiteName}
                onChangeText={setNewSiteName}
                autoFocus
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Adresse</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="430 rue Isabey"
                placeholderTextColor={colors.muted}
                value={newSiteAddress}
                onChangeText={setNewSiteAddress}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={[styles.fieldGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.muted }]}>Ville</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Montréal"
                  placeholderTextColor={colors.muted}
                  value={newSiteCity}
                  onChangeText={setNewSiteCity}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.muted }]}>Province</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="QC"
                  placeholderTextColor={colors.muted}
                  value={newSiteProvince}
                  onChangeText={setNewSiteProvince}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  cancelText: { fontSize: 15, fontWeight: "500" },
  addText: { fontSize: 15, fontWeight: "600" },
  saveText: { fontSize: 15, fontWeight: "600" },
  cacheBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cacheText: { fontSize: 12 },
  retryText: { fontSize: 12, fontWeight: "600" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, marginTop: 40 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 6 },
  errorSubText: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  emptySubText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  siteCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  siteCardContent: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  siteIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  siteName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  siteAddress: { fontSize: 12, lineHeight: 16 },
  siteNotes: { fontSize: 11, marginTop: 2, fontStyle: "italic" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20 },
  infoText: { fontSize: 12, lineHeight: 18 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, borderWidth: 1 },
});
