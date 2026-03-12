import { Stack } from "expo-router";

export default function TabsGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#0D0D0D" },
      }}
      initialRouteName="(main)"
    >
      <Stack.Screen name="(main)" />
      <Stack.Screen name="transaction" />
    </Stack>
  );
}
