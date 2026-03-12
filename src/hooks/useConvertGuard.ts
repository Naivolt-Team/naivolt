import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useHasBankDetails } from "./useHasBankDetails";

const BANK_DETAILS_ALERT_TITLE = "Bank details required";
const BANK_DETAILS_ALERT_MESSAGE =
  "You need to set your bank details first before you can convert. Add a bank account in Profile to receive Naira payments.";

export function useConvertGuard() {
  const router = useRouter();
  const { hasBankDetails, isLoading } = useHasBankDetails();

  const navigateToConvert = useCallback(() => {
    if (isLoading) return;
    if (!hasBankDetails) {
      Alert.alert(BANK_DETAILS_ALERT_TITLE, BANK_DETAILS_ALERT_MESSAGE, [
        { text: "OK", style: "cancel" },
        {
          text: "Go to Profile",
          onPress: () => router.replace("/(tabs)/(main)/profile"),
        },
      ]);
      return;
    }
    router.replace("/(tabs)/(main)/convert");
  }, [hasBankDetails, isLoading, router]);

  return { navigateToConvert, hasBankDetails, isLoading };
}

export { BANK_DETAILS_ALERT_TITLE, BANK_DETAILS_ALERT_MESSAGE };
