import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClients, updateClient, type Client } from "@/lib/storage";

export default function EditClientScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    const clients = await getClients();
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClient(found);
      setName(found.name);
      setCompany(found.company);
      setPhone(found.phone);
      setEmail(found.email || "");
      setAddress(found.address);
      setNotes(found.notes);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom du client est requis.");
      return;
    }

    if (!clientId) return;

    try {
      await updateClient(clientId, {
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le client.");
    }
  };

  if (!client) {
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
          <Text className="text-lg font-semibold text-foreground">Modifier Client</Text>
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
            <Text className="text-sm font-medium text-muted mb-2">Nom *</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Nom du client"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Compagnie</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Nom de la compagnie"
              placeholderTextColor={colors.muted}
              value={company}
              onChangeText={setCompany}
              returnKeyType="next"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Téléphone</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Numéro de téléphone"
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Email</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Adresse email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Adresse</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Adresse de livraison"
              placeholderTextColor={colors.muted}
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
              multiline
              numberOfLines={2}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">Notes</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border text-base"
              placeholder="Notes additionnelles"
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
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
