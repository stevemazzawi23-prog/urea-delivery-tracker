import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Platform, FlatList, ActivityIndicator } from "react-native";
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
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission === null) {
      // Permission is still loading
      return;
    }
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert("Erreur", "Caméra non disponible");
      return;
    }

    setIsLoading(true);
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
      console.error("Camera error:", error);
      Alert.alert("Erreur", "Impossible de prendre la photo.");
    } finally {
      setIsLoading(false);
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
      try {
        const { updateDelivery } = await import("@/lib/storage");
        await updateDelivery(deliveryId, { photos });
      } catch (error) {
        console.error("Error updating delivery:", error);
        Alert.alert("Erreur", "Impossible de sauvegarder les photos");
      }
    }

    router.back();
    setTimeout(() => {
      router.setParams({ photosJson: JSON.stringify(photos) });
    }, 100);
  };

  if (permission === null) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-foreground mt-4">Chargement des permissions...</Text>
        </View>
      </ScreenContainer>
    );
  }

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
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            activeOpacity={0.6}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "500" }}>Annuler</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>Photos ({photos.length})</Text>
          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.6}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Terminer</Text>
          </TouchableOpacity>
        </View>

        {/* Camera or Photos List */}
        {isCameraActive ? (
          <View style={{ flex: 1 }}>
            <CameraView 
              ref={cameraRef} 
              style={{ flex: 1 }}
              facing="back"
              onCameraReady={() => console.log("Camera ready")}
            />

            {/* Camera Controls */}
            <View style={{
              backgroundColor: "black",
              paddingHorizontal: 16,
              paddingVertical: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                disabled={isLoading}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: isLoading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "white",
                    }}
                  />
                )}
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
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                    Voir ({photos.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
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
                    <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Back to Camera Button */}
            <View style={{
              backgroundColor: colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
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
                <Text style={{ color: "white", fontWeight: "600" }}>Retour à la caméra</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
