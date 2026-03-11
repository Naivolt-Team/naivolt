import { Platform } from "react-native";

const envUrl = process.env.EXPO_PUBLIC_API_URL || "";
const defaultUrl = "http://localhost:5000";
// 10.0.2.2 is the Android emulator's alias to the host machine's loopback
const androidEmulatorUrl = "http://10.0.2.2:5000";

function getApiUrl(): string {
  if (envUrl && envUrl !== "" && envUrl.trim() !== "") {
    return envUrl.replace(/\/$/, "").trim();
  }
  if (Platform.OS === "android") {
    return androidEmulatorUrl;
  }
  return defaultUrl;
}

const apiUrl = getApiUrl();
console.log("API URL:", apiUrl);

export type WalletCoinId = "usdt" | "eth" | "btc" | "bnb" | "sol";

const walletUsdt =
  process.env.EXPO_PUBLIC_WALLET_USDT ||
  process.env.EXPO_PUBLIC_WALLET_ADDRESS ||
  "";
const walletEth = process.env.EXPO_PUBLIC_WALLET_ETH || "";
const walletBtc = process.env.EXPO_PUBLIC_WALLET_BTC || "";
const walletBnb = process.env.EXPO_PUBLIC_WALLET_BNB || "";
const walletSol = process.env.EXPO_PUBLIC_WALLET_SOL || "";

export const config = {
  apiUrl,
  walletAddress: walletUsdt,
  wallets: {
    usdt: walletUsdt,
    eth: walletEth,
    btc: walletBtc,
    bnb: walletBnb,
    sol: walletSol,
  } as Record<WalletCoinId, string>,
} as const;
