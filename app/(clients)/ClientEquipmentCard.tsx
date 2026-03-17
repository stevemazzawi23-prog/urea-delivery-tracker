import React, { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, FlatList } from "react-native";
import { trpc } from "@/lib/trpc"; // ajuste l'import si ton chemin diffère

type Props = { clientId: number };

export default function ClientEquipmentCard({ clientId }: Props) {
  // 1) LIRE la liste d'équipements pour ce client
  const { data: equipments, isLoading, error, refetch } =
    (trpc as any).equipment.listByClient.useQuery({ clientId });

  // 2) AJOUTER un équipement
  const createEq = (trpc as any).equipment.create.useMutation({
    onSuccess: () => {
      refetch();
      setName("");
      setModel("");
      setSerial("");
      setNotes("");
    },
  });

  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Erreur: {error.message}</Text>;

  return (
    <View style={{ padding: 12, gap: 8 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>Équipements du client</Text>

      {equipments?.length ? (
        <FlatList
          data={equipments}
          keyExtractor={(item) => String((item as any).id ?? (item as any).name)}
          renderItem={({ item }) => {
            const it: any = item;
            return (
              <View style={{ paddingVertical: 6 }}>
                <Text style={{ fontWeight: "600" }}>{it.name}</Text>
                {!!it.model && <Text>Modèle : {it.model}</Text>}
                {!!it.serial && <Text>S/N : {it.serial}</Text>}
                {!!it.notes && <Text>Notes : {it.notes}</Text>}
              </View>
            );
          }}
        />
      ) : (
        <Text>Aucun équipement pour ce client.</Text>
      )}

      <Text style={{ marginTop: 12, fontWeight: "600" }}>Ajouter un équipement</Text>
      <TextInput placeholder="Nom *" value={name} onChangeText={setName} style={{ borderWidth: 1, padding: 8, borderRadius: 6 }} />
      <TextInput placeholder="Modèle" value={model} onChangeText={setModel} style={{ borderWidth: 1, padding: 8, borderRadius: 6 }} />
      <TextInput placeholder="S/N" value={serial} onChangeText={setSerial} style={{ borderWidth: 1, padding: 8, borderRadius: 6 }} />
      <TextInput placeholder="Notes" value={notes} onChangeText={setNotes} style={{ borderWidth: 1, padding: 8, borderRadius: 6 }} />

      <Button
        title={createEq.isLoading ? "Ajout..." : "Ajouter"}
        onPress={() => {
          if (!name.trim()) return;
          createEq.mutate({ clientId, name, model, serial, notes });
        }}
      />
    </View>
  );
}
