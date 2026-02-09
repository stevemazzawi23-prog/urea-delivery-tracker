import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function ActiveDeliveryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clientId, clientName, clientCompany, siteId, siteName } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientCompany: string;
    siteId: string;
    siteName: string;
  }>();

  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liters, setLiters] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start timer
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStopDelivery = () => {
    if (!liters.trim() || isNaN(Number(liters)) || Number(liters) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un nombre de litres valide.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const endTime = Date.now();

    router.replace({
      pathname: "/delivery/summary",
      params: {
        clientId,
        clientName,
        clientCompany,
        siteId,
        siteName,
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        litersDelivered: liters,
        photosJson: JSON.stringify(photos),
      },
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Annuler la livraison",
                "Voulez-vous vraiment annuler cette livraison?",
                [
                  { text: "Non", style: "cancel" },
                  {
                    text: "Oui",
                    style: "destructive",
                    onPress: () => router.back(),
                  },
                ]
              );
            }}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text className="text-primary text-base font-medium">Annuler</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-8">
          {/* Client Info */}
          <View className="bg-surface rounded-2xl p-6 mb-8 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-1">{clientName}</Text>
            {clientCompany ? (
              <Text className="text-base text-muted mb-2">{clientCompany}</Text>
            ) : null}
            {siteName ? (
              <View className="mt-2 pt-2 border-t border-border">
                <Text className="text-sm font-medium text-muted mb-1">SITE</Text>
                <Text className="text-base font-semibold text-foreground">{siteName}</Text>
              </View>
            ) : null}
          </View>

          {/* Timer */}
          <View className="items-center mb-8">
            <Text className="text-sm font-medium text-muted mb-2">TEMPS ÉCOULÉ</Text>
            <Text className="text-6xl font-bold text-foreground tracking-wider">
              {formatTime(elapsedSeconds)}
            </Text>
          </View>

          {/* Start Time */}
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-sm font-medium text-muted mb-1">Heure de début</Text>
            <Text className="text-lg font-semibold text-foreground">
              {formatDateTime(startTime)}
            </Text>
          </View>

          {/* Liters Input */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-muted mb-2">Litres livrés</Text>
            <TextInput
              className="bg-surface rounded-xl px-6 py-4 text-foreground border border-border text-3xl font-semibold text-center"
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={liters}
              onChangeText={setLiters}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          {/* Photos Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-medium text-muted">Photos ({photos.length})</Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push({
                    pathname: "/delivery/capture-photo",
                    params: { photosJson: JSON.stringify(photos) },
                  });
                }}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm font-semibold">+ Ajouter</Text>
              </TouchableOpacity>
            </View>
            {photos.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      const newPhotos = photos.filter((_, i) => i !== index);
                      setPhotos(newPhotos);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    style={{ position: "relative" }}
                  >
                    <View className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-surface" />
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text className="text-white text-sm font-bold">×</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {/* Stop Button */}
          <TouchableOpacity
            onPress={handleStopDelivery}
            style={{
              backgroundColor: colors.error,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">Terminer la livraison</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
