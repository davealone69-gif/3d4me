import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;
  const active = "#B7A3FF";
  const muted = "#9B94B8";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: muted,
        tabBarStyle: {
          paddingTop: 7,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#121021",
          borderTopColor: "#302B4B",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Studio", tabBarIcon: ({ color }) => <MaterialIcons name="face-retouching-natural" size={24} color={color} /> }} />
      <Tabs.Screen name="gallery" options={{ title: "Gallery", tabBarIcon: ({ color }) => <MaterialIcons name="collections" size={24} color={color} /> }} />
      <Tabs.Screen name="safety" options={{ title: "Standard", tabBarIcon: ({ color }) => <MaterialIcons name="verified-user" size={24} color={color} /> }} />
    </Tabs>
  );
}
