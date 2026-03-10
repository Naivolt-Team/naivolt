import { Platform } from "react-native";

const envUrl = process.env.EXPO_PUBLIC_API_URL || "";
const defaultUrl = "http://localhost:5000";
const androidEmulatorUrl = "http://10.0.2.2:5000";

function getApiUrl(): string {
  if (envUrl && envUrl !== "" && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "");
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
