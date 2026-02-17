import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

/**
 * Shared layout with tab navigation for all pages
 * This layout is used by the (tabs) group and all detail pages
 * to ensure the tab bar is always visible
 */
export default function SharedLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
      {/* Main tab screens */}
      <Tabs.Screen
        name="(tabs)"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/* Detail pages - hidden from tab bar but still part of the navigation */}
      <Tabs.Screen
        name="client/detail"
        options={{
          href: null, // Hide from tab bar
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
      <Tabs.Screen
        name="driver/select"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings/equipment"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
