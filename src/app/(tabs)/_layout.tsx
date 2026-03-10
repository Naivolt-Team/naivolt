import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#16161A", borderTopColor: "#27272A" },
        tabBarActiveTintColor: "#AAFF00",
        tabBarInactiveTintColor: "#71717A",
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={focused ? "#AAFF00" : "#71717A"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="convert"
        options={{
          title: "Convert",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "swap-horizontal" : "swap-horizontal-outline"}
              size={24}
              color={focused ? "#AAFF00" : "#71717A"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={24}
              color={focused ? "#AAFF00" : "#71717A"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={focused ? "#AAFF00" : "#71717A"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
