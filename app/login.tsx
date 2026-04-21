import { useState } from "react";
import {
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
} from "react-native";
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
          <View style={styles.content}>
            {/* Logo/Title */}
            <View style={styles.logoSection}>
              <Text style={styles.logoEmoji}>🚛</Text>
              <Text style={[styles.appName, { color: colors.foreground }]}>SP Logistix</Text>
              <Text style={[styles.appSubtitle, { color: colors.muted }]}>
                Systeme de livraison d'uree
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formSection}>
              {/* Username */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Nom d'utilisateur</Text>
                <TextInput
                  placeholder="Entrez votre nom d'utilisateur"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                  ]}
                />
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Mot de passe</Text>
                <View
                  style={[
                    styles.passwordRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    placeholder="Entrez votre mot de passe"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    style={[styles.passwordInput, { color: colors.foreground }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={[
                styles.loginButton,
                { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 },
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Demo Credentials */}
            <View
              style={[
                styles.demoBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.demoTitle, { color: colors.muted }]}>
                Identifiants de demonstration:
              </Text>
              <Text style={[styles.demoText, { color: colors.muted }]}>
                <Text style={styles.demoBold}>Admin:</Text> admin / admin123
              </Text>
              <Text style={[styles.demoText, { color: colors.muted }]}>
                <Text style={styles.demoBold}>Chauffeur:</Text> driver1 / driver123
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  formSection: {
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordRow: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  demoBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  demoText: {
    fontSize: 12,
    marginBottom: 4,
  },
  demoBold: {
    fontWeight: "600",
  },
});
