import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* Main tab screens - visible to all users */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Clients",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
      {/* Admin-only tabs */}
      <Tabs.Screen
        name="audit"
        options={{
          title: "Audit",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.clipboard.fill" color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="drivers"
        options={{
          title: "Chauffeurs",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />

      {/* Detail pages - hidden from tab bar but still part of the navigation */}
      <Tabs.Screen
        name="client/detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="client/add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="client/edit"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="client/edit-email"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delivery/active"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delivery/select-client"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delivery/select-site"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delivery/summary"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delivery/detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delivery/capture-photo"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="invoice/create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="site/add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="site/edit"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}
