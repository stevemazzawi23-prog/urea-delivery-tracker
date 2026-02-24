import { useState } from "react";
import { Platform } from "react-native";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre nom d'utilisateur et mot de passe");
      return;
    }

    setIsLoading(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const success = await login(username, password);

      if (success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/(tabs)");
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert("Erreur", "Nom d'utilisateur ou mot de passe incorrect");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-8">
            {/* Logo/Title */}
            <View className="mb-12 items-center">
              <Text className="text-5xl font-bold text-primary mb-2">🚛</Text>
              <Text className="text-3xl font-bold text-foreground mb-2">SP Logistix</Text>
              <Text className="text-base text-muted text-center">
                Système de livraison d'urée
              </Text>
            </View>

            {/* Login Form */}
            <View className="gap-4 mb-6">
              {/* Username Input */}
              <View>
                <Text className="text-sm font-medium text-muted mb-2">Nom d'utilisateur</Text>
                <TextInput
                  placeholder="Entrez votre nom d'utilisateur"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  editable={!isLoading}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium text-muted mb-2">Mot de passe</Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <TextInput
                    placeholder="Entrez votre mot de passe"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      fontSize: 16,
                      color: colors.foreground,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ fontSize: 20 }}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 16,
                opacity: isLoading ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Demo Credentials */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text className="text-xs font-medium text-muted mb-2">Identifiants de démonstration:</Text>
              <Text className="text-xs text-muted mb-1">
                <Text className="font-semibold">Admin:</Text> admin / admin123
              </Text>
              <Text className="text-xs text-muted">
                <Text className="font-semibold">Chauffeur:</Text> driver1 / driver123
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
