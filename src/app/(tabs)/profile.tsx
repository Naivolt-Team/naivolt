import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

export default function Profile() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.expo}>This is my profile page</Text>
      <Link href="/" style={styles.link}>Go to home page</Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primaryText,
    marginBottom: 8,
  },
  expo: {
    color: colors.secondaryText,
    fontSize: 16,
    textAlign: "center",
    margin: 10,
  },
  link: {
    color: colors.primaryAccent,
    fontSize: 15,
    fontWeight: "600",
  },
});
