import React from "react";
import { SafeAreaView, View, Text } from "react-native";
import ClientEquipmentCard from "./ClientEquipmentCard";

export default function EquipmentDemoScreen() {
  const clientId = 1; // TODO: remplace par l'ID dynamique de ton client quand tu intégreras dans la vraie page
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}>
          Équipements – Client #{clientId}
        </Text>
        <ClientEquipmentCard clientId={clientId} />
      </View>
    </SafeAreaView>
  );
}
