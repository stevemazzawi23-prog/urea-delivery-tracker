import React from "react";
import { SafeAreaView, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ClientEquipmentCard from "./ClientEquipmentCard";

export default function ClientDetailScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const id = Number(clientId);
  if (!clientId || Number.isNaN(id)) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18 }}>Client manquant</Text>
          <Text>Ouvrez cette page avec ?clientId=1 (par exemple)</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}>
          Détails du client #{id}
        </Text>
        <ClientEquipmentCard clientId={id} />
      </View>
    </SafeAreaView>
  );
}
