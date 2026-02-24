import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClients, updateClient } from "@/lib/storage";
import { trpc } from "@/lib/trpc";

export default function EditEmailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [client, setClient] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const loadClient = async () => {
    const clients = await getClients();
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClient(found);
      setEmail(found.email || "");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClient();
    }, [clientId])
  );

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);
    try {
      // Update local storage
      await updateClient(clientId || "", { email: email.trim() });

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }

      Alert.alert("Succès", "Email mis à jour avec succès");
      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour l'email");
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 p-4">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
            Email du client
          </Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>
            {client.name}
          </Text>
        </View>

        {/* Email Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Adresse email
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.foreground,
              backgroundColor: colors.surface,
            }}
            placeholder="exemple@email.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Info */}
        <View style={{ marginBottom: 24, padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
            L'email sera utilisé pour envoyer les preuves de livraison (POD) après chaque livraison.
          </Text>
        </View>

        {/* Buttons */}
        <View style={{ gap: 12, marginTop: "auto" }}>
          <TouchableOpacity
            onPress={handleSaveEmail}
            disabled={loading}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{ color: colors.background, fontSize: 16, fontWeight: "600" }}>
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
