import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function WebsiteScreen() {
  const colors = useColors();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.email) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires (Nom et Email)");
      return;
    }

    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert("Succès", "Merci ! Nous vous contacterons sous peu.");
    setFormData({ nom: "", email: "", telephone: "", message: "" });
  };

  const handleEmailClick = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL("mailto:contact@splogistix.com");
  };

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#1B5E20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>SP</Text>
            </View>
            <Text style={{ fontWeight: "800", fontSize: 18, color: colors.foreground }}>
              SP Logistix
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={{ padding: 16, gap: 24 }}>
          {/* Hero Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, lineHeight: 36 }}>
              Des solutions logistiques fiables, efficaces et taillées pour votre croissance
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted, lineHeight: 24 }}>
              SP Logistix optimise vos opérations, flux et transports pour une chaîne d'approvisionnement fluide et performante.
            </Text>
          </View>

          {/* Services Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
              Nos services
            </Text>
            {[
              {
                title: "Gestion des opérations logistiques",
                desc: "Pilotage bout‑en‑bout, KPIs et amélioration continue.",
              },
              {
                title: "Optimisation des entrepôts",
                desc: "Lean, WMS et aménagement des flux.",
              },
              {
                title: "Solutions de transport",
                desc: "Routage, groupage, coûts et délais maîtrisés.",
              },
              {
                title: "Coordination des flux",
                desc: "Synchronisation fournisseurs–entrepôts–clients.",
              },
            ].map((service, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  {service.title}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
                  {service.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* About Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
              Qui sommes‑nous ?
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 24 }}>
              Chez <Text style={{ fontWeight: "600" }}>SP Logistix</Text>, nous mettons l'excellence opérationnelle au cœur de chaque mandat. Notre approche combine données, terrain et pragmatisme pour livrer des gains mesurables.
            </Text>
          </View>

          {/* Contact Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
              Contact
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 24 }}>
              Parlez‑nous de votre besoin et obtenez une proposition rapidement.
            </Text>

            {/* Contact Form */}
            <View style={{ gap: 12 }}>
              <TextInput
                placeholder="Nom"
                value={formData.nom}
                onChangeText={(value) => handleInputChange("nom", value)}
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
                placeholder="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
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
                placeholder="Téléphone"
                value={formData.telephone}
                onChangeText={(value) => handleInputChange("telephone", value)}
                keyboardType="phone-pad"
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
                placeholder="Votre message"
                value={formData.message}
                onChangeText={(value) => handleInputChange("message", value)}
                multiline
                numberOfLines={4}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  textAlignVertical: "top",
                }}
                placeholderTextColor={colors.muted}
              />

              {/* Action Buttons */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={{
                    backgroundColor: "#1B5E20",
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                    Envoyer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleEmailClick}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#1B5E20", fontWeight: "600", fontSize: 16 }}>
                    📧 Écrire un email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 16,
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
              © 2026 SP Logistix. Tous droits réservés.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
