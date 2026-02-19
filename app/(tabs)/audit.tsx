import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import {
  getAuditLogs,
  clearAuditLogs,
  type AuditLog,
} from "@/lib/audit-logger";

export default function AuditScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/(tabs)/home');
    }
  }, [user, router]);

  if (user?.role !== 'admin') {
    return null;
  }
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "login" | "client" | "delivery">(
    "all"
  );

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await getAuditLogs();
      let filtered = allLogs;

      if (filter === "login") {
        filtered = allLogs.filter((log) =>
          ["LOGIN", "LOGOUT"].includes(log.action)
        );
      } else if (filter === "client") {
        filtered = allLogs.filter((log) =>
          ["CREATE_CLIENT", "UPDATE_CLIENT", "DELETE_CLIENT"].includes(
            log.action
          )
        );
      } else if (filter === "delivery") {
        filtered = allLogs.filter((log) =>
          [
            "START_DELIVERY",
            "COMPLETE_DELIVERY",
            "ADD_PHOTO",
            "CREATE_INVOICE",
          ].includes(log.action)
        );
      }

      // Sort by timestamp descending (newest first)
      filtered.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(filtered);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      Alert.alert("Erreur", "Impossible de charger les journaux d'audit");
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer tous les journaux d'audit?",
      [
        { text: "Annuler", onPress: () => {} },
        {
          text: "Supprimer",
          onPress: async () => {
            try {
              await clearAuditLogs();
              setLogs([]);
              Alert.alert("Succès", "Tous les journaux ont été supprimés");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer les journaux");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: "Connexion",
      LOGOUT: "Déconnexion",
      CREATE_CLIENT: "Créer client",
      UPDATE_CLIENT: "Modifier client",
      DELETE_CLIENT: "Supprimer client",
      CREATE_SITE: "Créer site",
      UPDATE_SITE: "Modifier site",
      DELETE_SITE: "Supprimer site",
      START_DELIVERY: "Démarrer livraison",
      COMPLETE_DELIVERY: "Compléter livraison",
      ADD_PHOTO: "Ajouter photo",
      CREATE_INVOICE: "Créer facture",
      CREATE_DRIVER: "Créer chauffeur",
      UPDATE_DRIVER: "Modifier chauffeur",
      DELETE_DRIVER: "Supprimer chauffeur",
      VIEW_INVOICE: "Voir facture",
      ACCESS_DENIED: "Accès refusé",
    };
    return labels[action] || action;
  };

  const getStatusColor = (status: string) => {
    return status === "success" ? colors.success : colors.error;
  };

  // Admin only
  if (user?.role !== "admin") {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-2xl font-bold text-foreground mb-4">
            Accès Refusé
          </Text>
          <Text className="text-base text-muted text-center">
            Seuls les administrateurs peuvent accéder aux journaux d'audit.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary px-4 py-6">
          <Text className="text-3xl font-bold text-white mb-2">
            Journal d'Audit
          </Text>
          <Text className="text-white opacity-90">
            {logs.length} enregistrement{logs.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Filters */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">
            Filtrer par:
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {(["all", "login", "client", "delivery"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                className={`px-3 py-2 rounded-full ${
                  filter === f
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    filter === f ? "text-white" : "text-foreground"
                  }`}
                >
                  {f === "all"
                    ? "Tous"
                    : f === "login"
                      ? "Connexions"
                      : f === "client"
                        ? "Clients"
                        : "Livraisons"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logs List */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-muted">Chargement...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View className="flex-1 items-center justify-center py-8 px-4">
            <Text className="text-muted text-center">
              Aucun journal d'audit trouvé
            </Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="px-4 py-3 border-b border-border">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {getActionLabel(item.action)}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {item.userName} ({item.userRole})
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded ${
                      item.status === "success"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        item.status === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {item.status === "success" ? "✓" : "✗"}
                    </Text>
                  </View>
                </View>

                {item.resourceName && (
                  <Text className="text-sm text-foreground mb-1">
                    Ressource: {item.resourceName}
                  </Text>
                )}

                {item.errorMessage && (
                  <Text className="text-xs text-error mb-1">
                    Erreur: {item.errorMessage}
                  </Text>
                )}

                <Text className="text-xs text-muted">
                  {formatDate(item.timestamp)}
                </Text>
              </View>
            )}
          />
        )}

        {/* Clear Logs Button */}
        {logs.length > 0 && (
          <View className="px-4 py-4">
            <TouchableOpacity
              onPress={handleClearLogs}
              className="bg-error px-4 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">
                Supprimer tous les journaux
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
