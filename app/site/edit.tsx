import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getSites, updateSite, type Site } from "@/lib/storage";

export default function EditSiteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadSite();
  }, [siteId]);

  const loadSite = async () => {
    const sites = await getSites();
    const found = sites.find((s) => s.id === siteId);
    if (found) {
      setSite(found);
      setName(found.name);
      setAddress(found.address);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom du site est requis.");
      return;
    }

    if (!siteId) return;

    try {
      await updateSite(siteId, {
        name: name.trim(),
        address: address.trim(),
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le site.");
    }
  };

  if (!site) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
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
          <Text className="text-lg font-semibold text-foreground">Modifier Site</Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              handleSave();
            }}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text className="text-primary text-base font-semibold">Sauvegarder</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 px-4 pt-6">
          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Nom du site *</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Nom du site de livraison"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Adresse</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Adresse du site"
              placeholderTextColor={colors.muted}
              value={address}
              onChangeText={setAddress}
              returnKeyType="done"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
