import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveClient } from "@/lib/storage";

export default function AddClientScreen() {
  const colors = useColors();
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [portalCode, setPortalCode] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Erreur", "Le nom du client est requis."); return; }
    if (!portalCode.trim()) { Alert.alert("Erreur", "Le code portail est requis. Vous le trouverez dans la liste des clients du portail SP Logistix."); return; }
    try {
      await saveClient({ name: name.trim(), company: company.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), notes: notes.trim(), portalCode: portalCode.trim().toUpperCase() });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) { Alert.alert("Erreur", "Impossible de sauvegarder le client."); }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }];
  const requiredInputStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.primary, color: colors.foreground, borderWidth: 1.5 }];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} activeOpacity={0.6}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Annuler</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nouveau Client</Text>
          <TouchableOpacity onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSave(); }} activeOpacity={0.6}>
            <Text style={[styles.saveText, { color: colors.primary }]}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={[styles.fieldGroup, styles.portalCodeBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.label, { color: colors.primary, fontWeight: "700" }]}>🔗 Code Portail SP Logistix *</Text>
            <TextInput style={requiredInputStyle} placeholder="Ex: TES001, CLT-001..." placeholderTextColor={colors.muted} value={portalCode} onChangeText={setPortalCode} autoCapitalize="characters" returnKeyType="next" />
            <Text style={[styles.hint, { color: colors.muted }]}>Ce code se trouve dans la liste des clients du portail admin SP Logistix. Il permet de lier les livraisons au bon client.</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Nom *</Text>
            <TextInput style={inputStyle} placeholder="Nom du client" placeholderTextColor={colors.muted} value={name} onChangeText={setName} autoFocus returnKeyType="next" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Compagnie</Text>
            <TextInput style={inputStyle} placeholder="Nom de la compagnie" placeholderTextColor={colors.muted} value={company} onChangeText={setCompany} returnKeyType="next" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Telephone</Text>
            <TextInput style={inputStyle} placeholder="Numero de telephone" placeholderTextColor={colors.muted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput style={inputStyle} placeholder="Adresse email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" returnKeyType="next" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Adresse</Text>
            <TextInput style={[inputStyle, styles.multiline]} placeholder="Adresse de livraison" placeholderTextColor={colors.muted} value={address} onChangeText={setAddress} returnKeyType="next" multiline numberOfLines={2} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Notes</Text>
            <TextInput style={[inputStyle, styles.multiline]} placeholder="Notes additionnelles" placeholderTextColor={colors.muted} value={notes} onChangeText={setNotes} returnKeyType="done" multiline numberOfLines={3} />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  cancelText: { fontSize: 15, fontWeight: "500" },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  saveText: { fontSize: 15, fontWeight: "600" },
  form: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  fieldGroup: { marginBottom: 20 },
  portalCodeBox: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  hint: { fontSize: 11, marginTop: 6, lineHeight: 16 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
});
