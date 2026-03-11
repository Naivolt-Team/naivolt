import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { colors, theme } from "@/constants/theme";
import StatusBadge from "@/components/transaction/StatusBadge";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "paid"
  | "rejected";

interface Transaction {
  _id: string;
  coin?: string;
  network?: string;
  amountCrypto?: number;
  amountNaira?: number;
  rateAtTime?: number;
  walletAddress?: string;
  proofImageUrl?: string;
  proofImage?: string;
  transactionHash?: string;
  status: TransactionStatus;
  adminNote?: string;
  createdAt: string;
  paidAt?: string;
}

const COIN_COLORS: Record<string, string> = {
  USDT: "#26A17B",
  ETH: "#627EEA",
  BTC: "#F7931A",
  BNB: "#F3BA2F",
  SOL: "#9945FF",
  USDC: "#2775CA",
  LTC: "#345D9D",
};

const COIN_SYMBOLS: Record<string, string> = {
  USDT: "₮",
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎",
  BNB: "B",
  LTC: "Ł",
  USDC: "$",
};

const STATUS_DESCRIPTION: Record<TransactionStatus, string> = {
  pending: "Waiting for payment verification",
  processing: "Your payment is being processed",
  paid: "Payment sent to your bank account",
  rejected: "Transaction was rejected",
};

const DEFAULT_COIN_COLOR = colors.secondaryText;
const DEFAULT_COIN_SYMBOL = "?";

function getCoinColor(coin?: string): string {
  if (!coin) return DEFAULT_COIN_COLOR;
  return COIN_COLORS[coin.toUpperCase()] ?? DEFAULT_COIN_COLOR;
}

function getCoinSymbol(coin?: string): string {
  if (!coin) return DEFAULT_COIN_SYMBOL;
  return COIN_SYMBOLS[coin.toUpperCase()] ?? coin.charAt(0).toUpperCase();
}

function truncateHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function useTransactionId(): string | undefined {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = params.id;
  if (raw == null) return undefined;
  const id = Array.isArray(raw) ? raw[0] : raw;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const id = useTransactionId();
  const [copied, setCopied] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);

  const {
    data: transaction,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["transaction", id ?? ""],
    queryFn: async () => {
      const res = await api.get<{ data?: Transaction; status?: string } | Transaction>(
        `/transactions/${id}`
      );
      const raw = res.data as { data?: Transaction } & Transaction;
      const tx = raw?.data ?? raw;
      return tx as Transaction;
    },
    enabled: !!id,
  });

  const tx = transaction
    ? {
        ...transaction,
        proofImageUrl: transaction.proofImageUrl ?? transaction.proofImage,
      }
    : null;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCopyHash = useCallback(async () => {
    if (!tx?.transactionHash) return;
    await Clipboard.setStringAsync(tx.transactionHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [tx?.transactionHash]);

  const handleTryAgain = useCallback(() => {
    router.replace("/(tabs)/convert");
  }, [router]);

  if (!id || (typeof id === "string" && id.length === 0)) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Invalid transaction</Text>
          <Text style={styles.errorSub}>No transaction ID was provided.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !tx) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle" size={40} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>Couldn't load transaction</Text>
          <Text style={styles.errorSub}>Something went wrong.</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const coin = tx.coin ?? "USDT";
  const coinColor = getCoinColor(tx.coin);
  const coinSymbol = getCoinSymbol(tx.coin);
  const title = `${coin} Conversion`;
  const proofImageUrl = tx.proofImageUrl ?? tx.proofImage;

  const adminNoteBorderColor =
    tx.status === "paid"
      ? colors.primaryAccent
      : tx.status === "rejected"
        ? colors.error
        : colors.pending;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroCoinCircle, { backgroundColor: coinColor }]}>
            <Text style={styles.heroCoinSymbol}>{coinSymbol}</Text>
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
          {tx.network ? (
            <View style={styles.heroNetworkBadge}>
              <Text style={styles.heroNetworkText}>{tx.network}</Text>
            </View>
          ) : null}
          <StatusBadge status={tx.status} />
          <Text style={styles.statusDescription}>
            {STATUS_DESCRIPTION[tx.status]}
          </Text>
        </View>

        {/* Amount card */}
        <Text style={styles.sectionLabel}>AMOUNTS</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Crypto sent</Text>
            <Text style={styles.detailValue}>
              {tx.amountCrypto ?? "—"} {coin}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Naira value</Text>
            <Text style={[styles.detailValue, styles.detailValueAccent]}>
              {tx.amountNaira != null
                ? formatCurrency(tx.amountNaira, "NGN", true)
                : "—"}
            </Text>
          </View>
          {tx.rateAtTime != null && (
            <View style={styles.rateRow}>
              <Text style={styles.rateText}>
                Rate at time: 1 {coin} ={" "}
                {formatCurrency(tx.rateAtTime, "NGN", true)}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction info card */}
        <Text style={styles.sectionLabel}>DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>
              #{tx._id.slice(-8)}
            </Text>
          </View>
          {tx.network ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network</Text>
              <Text style={styles.detailValue}>{tx.network}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{formatDate(tx.createdAt)}</Text>
          </View>
          {tx.paidAt ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paid at</Text>
              <Text style={styles.detailValue}>{formatDate(tx.paidAt)}</Text>
            </View>
          ) : null}
          {tx.transactionHash ? (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Tx Hash</Text>
              <View style={styles.hashRow}>
                <Text style={styles.detailValue}>
                  {truncateHash(tx.transactionHash)}
                </Text>
                <Pressable
                  style={styles.copyBtn}
                  onPress={handleCopyHash}
                >
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={18}
                    color={colors.primaryAccent}
                  />
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Tx Hash</Text>
              <Text style={styles.detailValue}>—</Text>
            </View>
          )}
        </View>

        {/* Proof image card */}
        {proofImageUrl ? (
          <>
            <Text style={styles.sectionLabel}>PAYMENT PROOF</Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => setProofModalVisible(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: proofImageUrl }}
                style={styles.proofImage}
                resizeMode="cover"
              />
              <Text style={styles.tapToView}>Tap to view full image</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Admin note card */}
        {tx.adminNote ? (
          <>
            <Text style={styles.sectionLabel}>NOTE FROM ADMIN</Text>
            <View style={[styles.card, styles.adminNoteCard, { borderLeftColor: adminNoteBorderColor }]}>
              <Text style={styles.adminNoteText}>{tx.adminNote}</Text>
            </View>
          </>
        ) : null}

        {/* Bottom action */}
        {(tx.status === "pending" || tx.status === "rejected") && (
          <View style={styles.bottomAction}>
            {tx.status === "pending" ? (
              <View style={styles.waitingBtn}>
                <Text style={styles.waitingBtnText}>
                  Waiting for verification...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.tryAgainBtn}
                onPress={handleTryAgain}
                activeOpacity={0.85}
              >
                <Text style={styles.tryAgainBtnText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {copied && (
        <View style={styles.copiedToast}>
          <Text style={styles.copiedToastText}>Copied!</Text>
        </View>
      )}

      {/* Full-screen proof image modal */}
      <Modal
        visible={proofModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setProofModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {proofImageUrl ? (
              <Image
                source={{ uri: proofImageUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : null}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setProofModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.primaryText} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 20;
const BORDER_COLOR = "#2A2A2A";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primaryText,
  },
  headerRight: {
    width: 44,
    height: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryText,
    marginBottom: theme.spacing.xs,
  },
  errorSub: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: theme.spacing.lg,
  },
  errorActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryText,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.button,
    backgroundColor: colors.primaryAccent,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: CARD_RADIUS,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  heroCoinCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  heroCoinSymbol: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primaryText,
    marginBottom: theme.spacing.xs,
  },
  heroNetworkBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.badge,
    marginBottom: theme.spacing.sm,
  },
  heroNetworkText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.secondaryText,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryText,
  },
  detailValueAccent: {
    color: colors.primaryAccent,
  },
  rateRow: {
    paddingVertical: 12,
    paddingTop: 4,
  },
  rateText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  hashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyBtn: {
    padding: 4,
  },
  proofImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
  },
  tapToView: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  adminNoteCard: {
    borderLeftWidth: 4,
    padding: theme.spacing.md,
  },
  adminNoteText: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
  },
  bottomAction: {
    marginTop: theme.spacing.sm,
  },
  waitingBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    opacity: 0.8,
  },
  waitingBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.secondaryText,
  },
  tryAgainBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.button,
    backgroundColor: colors.primaryAccent,
    alignItems: "center",
  },
  tryAgainBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  copiedToast: {
    position: "absolute",
    bottom: theme.spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  copiedToastText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
    backgroundColor: colors.primaryAccent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.badge,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  modalCloseArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "80%",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 50,
    right: theme.spacing.lg,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
