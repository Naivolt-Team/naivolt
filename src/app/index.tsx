import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    const t = setTimeout(() => {
      try {
        router.replace("/welcome");
      } catch (_) {}
    }, 100);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.placeholder}>
      <ActivityIndicator size="large" color="#AAFF00" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: "#0A0A0B",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#AAFF00",
    marginTop: 12,
    fontSize: 16,
  },
});
