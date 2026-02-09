import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, Platform, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Image } from "react-native";

export default function CapturePhotoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { photosJson, isPostDelivery, deliveryId } = useLocalSearchParams<{ 
    photosJson: string;
    isPostDelivery: string;
    deliveryId: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>(photosJson ? JSON.parse(photosJson) : []);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setPhotos([...photos, photo.uri]);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de prendre la photo.");
    }
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDone = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isPostDelivery === "true" && deliveryId) {
      // Update delivery with new photos
      try {
        const { getDeliveries, deleteDelivery, saveDelivery } = await import("@/lib/storage");
        const deliveries = await getDeliveries();
        const delivery = deliveries.find((d) => d.id === deliveryId);
        
        if (delivery) {
          await deleteDelivery(deliveryId);
          await saveDelivery({
            ...delivery,
            photos,
          });
        }
      } catch (error) {
        console.error("Error updating delivery:", error);
      }
    }

    router.back();
    // Pass photos back through route params
    setTimeout(() => {
      router.setParams({ photosJson: JSON.stringify(photos) });
    }, 100);
  };

  if (!permission?.granted) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-lg font-semibold text-foreground mb-4 text-center">
            Permission d'accès à la caméra requise
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Autoriser l'accès</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
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
          <Text className="text-lg font-semibold text-foreground">Photos ({photos.length})</Text>
          <TouchableOpacity
            onPress={handleDone}
            style={{ opacity: 1 }}
            activeOpacity={0.6}
          >
            <Text className="text-primary text-base font-semibold">Terminer</Text>
          </TouchableOpacity>
        </View>

        {/* Camera or Photos List */}
        {isCameraActive ? (
          <View className="flex-1">
            <CameraView ref={cameraRef} className="flex-1" facing="back" />

            {/* Camera Controls */}
            <View className="bg-black px-4 py-6 flex-row items-center justify-center gap-4">
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "white",
                  }}
                />
              </TouchableOpacity>

              {photos.length > 0 && (
                <TouchableOpacity
                  onPress={() => setIsCameraActive(false)}
                  style={{
                    backgroundColor: colors.surface,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-foreground font-semibold">
                    Voir ({photos.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View className="flex-1">
            {/* Photos Gallery */}
            <FlatList
              data={photos}
              keyExtractor={(_, index) => index.toString()}
              numColumns={2}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item, index }) => (
                <View style={{ flex: 1, margin: 8, position: "relative" }}>
                  <Image
                    source={{ uri: item }}
                    style={{
                      width: "100%",
                      height: 160,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => handleDeletePhoto(index)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-lg font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Back to Camera Button */}
            <View className="bg-surface px-4 py-4 border-t border-border">
              <TouchableOpacity
                onPress={() => setIsCameraActive(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold">Retour à la caméra</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
