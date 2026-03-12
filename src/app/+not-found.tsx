import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.sub}>The page you’re looking for doesn’t exist.</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 24,
  },
  btn: {
    backgroundColor: "#AAFF00",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
});
