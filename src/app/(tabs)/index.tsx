import { Image } from "expo-image";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.expo}>This is my first expo app</Text>
      <Image
        source={require("../../../assets/images/testexpo.png")}
        style={styles.image}
        contentFit="contain"
      />
      <Link style={styles.link} href={"/profile"}>Go to home</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  expo: {
    color: "#208AEF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    margin: 10,
  },
  image: {
    width: 400,
    height: 400,
  },
  link: {
    backgroundColor: "#208AEF",
    color: "white",
    padding: 10,
    borderRadius: 5,
    margin: 10,
    textAlign: "center",
  },
});
