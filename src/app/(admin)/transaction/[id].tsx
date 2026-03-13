import { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { colors, theme } from "@/constants/theme";
import StatusBadge from "@/components/transaction/StatusBadge";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const ADMIN_SURFACE = "#1A1A1A";
const ADMIN_BORDER = "#2A2A2A";
const PENDING_COLOR = "#F0B429";

type TransactionStatus = "pending" | "processing" | "paid" | "rejected";

interface AdminTransaction {
  _id: string;
  coin?: string;
  network?: string;
  amountCrypto?: number;
  amountNaira?: number;
  rateAtTime?: number;
  walletAddress?: string;
  proofImage?: string;
  proofImageUrl?: string;
  transactionHash?: string;
  status: TransactionStatus;
  adminNote?: string;
  createdAt: string;
  paidAt?: string;
  user?: {
    _id: string;
    name: string;
    username?: string;
    email: string;
    phone?: string;
  };
  userId?: {
    _id: string;
    name: string;
    username?: string;
    email: string;
    phone?: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
  } | null;
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

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getStatusDescription(status: TransactionStatus): string {
  switch (status) {
    case "pending":
      return "Awaiting your review";
    case "processing":
      return "Currently processing";
    case "paid":
      return "Payment has been sent";
    case "rejected":
      return "Transaction was rejected";
    default:
      return "";
  }
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 20) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export default function AdminTransactionDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [rejectInputFocused, setRejectInputFocused] = useState(false);
  const copyToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: tx,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminTransaction", id],
    queryFn: async (): Promise<AdminTransaction | null> => {
      if (!id) return null;
      const res = await api.get(`/admin/transactions/${id}`);
      const data = res.data?.data ?? res.data;
      return data ?? null;
    },
    enabled: !!id,
  });

  const user = tx?.user ?? tx?.userId;
  const proofImageUrl = tx?.proofImage ?? tx?.proofImageUrl;
  const coin = tx?.coin ?? "USDT";
  const coinColor = getCoinColor(tx?.coin);
  const coinSymbol = getCoinSymbol(tx?.coin);

  // Normalise status so we don't depend on exact casing/spacing
  const normalizedStatus = tx?.status
    ? String(tx.status).toLowerCase().trim()
    : undefined;

  const isResolved =
    !!normalizedStatus &&
    (normalizedStatus === "paid" || normalizedStatus === "rejected");

  const handleCopyHash = useCallback(async () => {
    const hash = tx?.transactionHash;
    if (!hash) return;
    await Clipboard.setStringAsync(hash);
    setCopyToastVisible(true);
    if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
    copyToastTimer.current = setTimeout(() => {
      setCopyToastVisible(false);
      copyToastTimer.current = null;
    }, 2000);
  }, [tx?.transactionHash]);

  const handleCopyAccountNumber = useCallback(async () => {
    const accountNumber = tx?.bankAccount?.accountNumber;
    if (!accountNumber) return;
    await Clipboard.setStringAsync(accountNumber);
    setCopyToastVisible(true);
    if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
    copyToastTimer.current = setTimeout(() => {
      setCopyToastVisible(false);
      copyToastTimer.current = null;
    }, 2000);
  }, [tx?.bankAccount?.accountNumber]);

  useEffect(() => {
    return () => {
      if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
    };
  }, []);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminTransaction", id] });
    queryClient.invalidateQueries({ queryKey: ["adminTransactions"] });
    queryClient.invalidateQueries({ queryKey: ["adminStats"] });
  }, [queryClient, id]);

  const handleApproveConfirm = useCallback(async () => {
    if (!id) return;
    setApproveSubmitting(true);
    setApproveError(null);
    try {
      await api.patch(`/admin/transactions/${id}/approve`, {
        adminNote: approveNote.trim() || undefined,
      });
      invalidateQueries();
      setApproveModalVisible(false);
      setApproveNote("");
      Alert.alert("Approved! ✅", "Transaction has been marked as paid.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to approve"
          : "Failed to approve";
      setApproveError(message);
    } finally {
      setApproveSubmitting(false);
    }
  }, [id, approveNote, invalidateQueries, router]);

  const handleRejectConfirm = useCallback(async () => {
    if (!id || !rejectReason.trim()) return;
    setRejectSubmitting(true);
    setRejectError(null);
    try {
      await api.patch(`/admin/transactions/${id}/reject`, {
        adminNote: rejectReason.trim(),
      });
      invalidateQueries();
      setRejectModalVisible(false);
      setRejectReason("");
      Alert.alert("Rejected", "Transaction has been rejected.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to reject"
          : "Failed to reject";
      setRejectError(message);
    } finally {
      setRejectSubmitting(false);
    }
  }, [id, rejectReason, invalidateQueries, router]);

  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Invalid transaction</Text>
          <Pressable style={styles.backBtnStandalone} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
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
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load transaction</Text>
          <Text style={styles.errorSub}>Something went wrong.</Text>
          <View style={styles.errorActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const adminNoteBorderColor =
    tx.status === "paid"
      ? colors.primaryAccent
      : tx.status === "rejected"
        ? colors.error
        : PENDING_COLOR;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Transaction Review
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Status hero card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroCoinCircle, { backgroundColor: coinColor }]}>
            <Text style={styles.heroCoinSymbol}>{coinSymbol}</Text>
          </View>
          <Text style={styles.heroTitle}>{coin} Conversion</Text>
          {tx.network ? (
            <View style={styles.networkBadge}>
              <Text style={styles.networkText}>{tx.network}</Text>
            </View>
          ) : null}
          <StatusBadge status={tx.status} />
          <Text style={styles.statusDesc}>{getStatusDescription(tx.status)}</Text>
          {isResolved && (
            <Text style={styles.resolvedHint}>
              This transaction has already been resolved
            </Text>
          )}
        </View>

        {/* Send Money To card — most important */}
        <Text style={styles.sectionLabel}>SEND MONEY TO</Text>
        {tx.bankAccount ? (
          <View style={[styles.card, styles.sendMoneyCard]}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank</Text>
              <Text style={styles.detailValueBold}>
                {tx.bankAccount.bankName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Pressable style={styles.hashRow} onPress={handleCopyAccountNumber}>
                <Text style={styles.accountNumberText}>
                  {tx.bankAccount.accountNumber}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={colors.primaryAccent}
                />
              </Pressable>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Account Name</Text>
              <Text style={styles.detailValue}>
                {tx.bankAccount.accountName}
              </Text>
            </View>
            <View style={styles.sendWarning}>
              <Text style={styles.sendWarningText}>
                {"⚠️ Send "}
                {formatCurrency(tx.amountNaira ?? 0, "NGN", true)}
                {" to this account\nbefore tapping Approve."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.sendMoneyMissingCard]}>
            <View style={styles.noAccountRow}>
              <Ionicons name="warning-outline" size={24} color={colors.error} />
              <Text style={styles.noAccountText}>No bank account on file</Text>
            </View>
            <Text style={styles.noAccountSub}>
              Contact the user to add a bank account before approving
            </Text>
          </View>
        )}

        {/* User info card */}
        <Text style={styles.sectionLabel}>CUSTOMER</Text>
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {getInitials(user?.name)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name ?? "—"}</Text>
              {user?.username ? (
                <Text style={styles.userUsername}>@{user.username}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{user?.email ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{user?.phone ?? "—"}</Text>
          </View>
        </View>

        {/* Amounts card */}
        <Text style={styles.sectionLabel}>AMOUNTS</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Crypto sent</Text>
            <Text style={styles.detailValueBold}>
              {tx.amountCrypto != null ? `${tx.amountCrypto} ${coin}` : "—"}
            </Text>
          </View>
          <View
            style={[
              styles.detailRow,
              tx.rateAtTime == null && styles.detailRowLast,
            ]}
          >
            <Text style={styles.detailLabel}>Naira value</Text>
            <Text style={[styles.detailValueBold, { color: colors.primaryAccent }]}>
              {tx.amountNaira != null
                ? formatCurrency(tx.amountNaira, "NGN", true)
                : "—"}
            </Text>
          </View>
          {tx.rateAtTime != null && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Rate at time</Text>
              <Text style={styles.detailValueSmall}>
                1 {coin} = {formatCurrency(tx.rateAtTime, "NGN", true)}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction details card */}
        <Text style={styles.sectionLabel}>DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>#{tx._id.slice(-8)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>{tx.network ?? "—"}</Text>
          </View>
          <View
            style={[
              styles.detailRow,
              !tx.paidAt && !tx.transactionHash && styles.detailRowLast,
            ]}
          >
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{formatDate(tx.createdAt)}</Text>
          </View>
          {tx.paidAt ? (
            <View
              style={[
                styles.detailRow,
                !tx.transactionHash && styles.detailRowLast,
              ]}
            >
              <Text style={styles.detailLabel}>Paid at</Text>
              <Text style={styles.detailValue}>{formatDate(tx.paidAt)}</Text>
            </View>
          ) : null}
          {tx.transactionHash ? (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Tx Hash</Text>
              <Pressable style={styles.hashRow} onPress={handleCopyHash}>
                <Text style={styles.hashText}>
                  {truncateHash(tx.transactionHash)}
                </Text>
                <Ionicons name="copy-outline" size={18} color={colors.primaryAccent} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Proof image card */}
        <Text style={styles.sectionLabel}>PAYMENT PROOF</Text>
        {proofImageUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setProofModalVisible(true)}
            style={styles.proofImageWrap}
          >
            <Image
              source={{ uri: proofImageUrl }}
              style={styles.proofImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <View style={styles.noProofWrap}>
              <Ionicons name="warning-outline" size={32} color={colors.secondaryText} />
              <Text style={styles.noProofText}>No proof image uploaded</Text>
            </View>
          </View>
        )}

        {/* Admin note card */}
        {tx.adminNote ? (
          <>
            <Text style={styles.sectionLabel}>ADMIN NOTE</Text>
            <View
              style={[
                styles.card,
                styles.adminNoteCard,
                { borderLeftColor: adminNoteBorderColor },
              ]}
            >
              <Text style={styles.adminNoteText}>{tx.adminNote}</Text>
            </View>
          </>
        ) : null}

        {(tx.status === "pending" || tx.status === "processing") && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => {
                setRejectError(null);
                setRejectModalVisible(true);
              }}
            >
              <Text style={styles.rejectBtnText} numberOfLines={1}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveBtn, !tx.bankAccount && styles.btnDisabled]}
              onPress={() => {
                if (tx.bankAccount) {
                  setApproveError(null);
                  setApproveModalVisible(true);
                }
              }}
              disabled={!tx.bankAccount}
            >
              <Text style={styles.approveBtnText} numberOfLines={1}>Approve ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {(tx.status === "paid" || tx.status === "rejected") && (
          <View style={styles.resolvedBanner}>
            <Text style={styles.resolvedText}>This transaction has already been resolved</Text>
          </View>
        )}
      </ScrollView>

      {/* Copy toast */}
      {copyToastVisible && (
        <View style={styles.copyToast}>
          <Text style={styles.copyToastText}>Copied!</Text>
        </View>
      )}

      {/* Proof image modal */}
      <Modal
        visible={proofModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProofModalVisible(false)}
        >
          <View style={styles.proofModalContent}>
            <Image
              source={{ uri: proofImageUrl }}
              style={styles.proofModalImage}
              resizeMode="contain"
            />
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setProofModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Approve modal */}
      <Modal
        visible={approveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !approveSubmitting && setApproveModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !approveSubmitting && setApproveModalVisible(false)}
        >
          <Pressable style={styles.slideModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Approve Transaction</Text>
            <Text style={styles.modalSummary}>
              This will mark the transaction as PAID. Make sure you have sent{" "}
              {tx.amountNaira != null ? formatCurrency(tx.amountNaira, "NGN", true) : "—"}{" "}
              {"to the user's bank account before approving."}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.secondaryText}
              value={approveNote}
              onChangeText={setApproveNote}
              multiline
              maxLength={200}
              editable={!approveSubmitting}
            />
            {approveError ? (
              <Text style={styles.modalError}>{approveError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setApproveModalVisible(false)}
                disabled={approveSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, approveSubmitting && styles.modalConfirmDisabled]}
                onPress={handleApproveConfirm}
                disabled={approveSubmitting}
              >
                {approveSubmitting ? (
                  <ActivityIndicator size="small" color={colors.buttonTextOnAccent} />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Approval</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reject modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !rejectSubmitting && setRejectModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !rejectSubmitting && setRejectModalVisible(false)}
        >
          <Pressable style={styles.slideModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reject Transaction</Text>
            <Text style={styles.modalSummary}>
              Please provide a clear reason. The user will see this note.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                rejectInputFocused && { borderColor: colors.error },
              ]}
              placeholder="Rejection reason (required)"
              placeholderTextColor={colors.secondaryText}
              value={rejectReason}
              onChangeText={setRejectReason}
              onFocus={() => setRejectInputFocused(true)}
              onBlur={() => setRejectInputFocused(false)}
              multiline
              maxLength={200}
              editable={!rejectSubmitting}
            />
            <Text style={styles.charCount}>{rejectReason.length} / 200</Text>
            {rejectError ? (
              <Text style={styles.modalError}>{rejectError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={rejectSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalRejectBtn,
                  (!rejectReason.trim() || rejectSubmitting) && styles.modalConfirmDisabled,
                ]}
                onPress={handleRejectConfirm}
                disabled={!rejectReason.trim() || rejectSubmitting}
              >
                {rejectSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <Text style={styles.modalRejectBtnText}>Confirm Rejection</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_BORDER,
    marginBottom: theme.spacing.lg,
  },
  headerBack: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryText,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
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
    backgroundColor: ADMIN_SURFACE,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
    borderRadius: 20,
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
    color: colors.primaryText,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryText,
    marginBottom: theme.spacing.xs,
  },
  networkBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.badge,
    marginBottom: theme.spacing.sm,
  },
  networkText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: "600",
  },
  statusDesc: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
  },
  resolvedHint: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: theme.spacing.xs,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: ADMIN_SURFACE,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ADMIN_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryAccent,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryText,
  },
  userUsername: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_BORDER,
    marginVertical: theme.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_BORDER,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  detailValue: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: "500",
  },
  detailValueBold: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: "700",
  },
  detailValueSmall: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  hashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hashText: {
    fontSize: 13,
    color: colors.primaryAccent,
    fontWeight: "600",
  },
  accountNumberText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryText,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  proofImageWrap: {
    marginBottom: theme.spacing.lg,
    borderRadius: 14,
    overflow: "hidden",
  },
  proofImage: {
    width: "100%",
    height: 240,
    borderRadius: 14,
  },
  noProofWrap: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  noProofText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
  },
  adminNoteCard: {
    borderLeftWidth: 4,
  },
  adminNoteText: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
  },
  sendMoneyCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryAccent,
  },
  sendMoneyMissingCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  sendWarning: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PENDING_COLOR,
    backgroundColor: "rgba(240, 180, 41, 0.15)",
    alignSelf: "stretch",
  },
  sendWarningText: {
    fontSize: 13,
    color: PENDING_COLOR,
  },
  noAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  noAccountText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.error,
  },
  noAccountSub: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    width: "100%",
  },
  rejectBtn: {
    flex: 1,
    flexBasis: 0,
    flexShrink: 0,
    backgroundColor: "rgba(255, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.error,
  },
  approveBtn: {
    flex: 1,
    flexBasis: 0,
    flexShrink: 0,
    backgroundColor: colors.primaryAccent,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  resolvedBanner: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  resolvedText: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: "center",
  },
  resolvedMessage: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  copyToast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: colors.primaryAccent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  copyToastText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  errorText: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryText,
    marginTop: theme.spacing.md,
  },
  errorSub: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: theme.spacing.xs,
  },
  errorActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  backBtnStandalone: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: {
    fontSize: 16,
    color: colors.primaryAccent,
    fontWeight: "600",
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primaryText,
  },
  retryBtn: {
    backgroundColor: colors.primaryAccent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  proofModalContent: {
    backgroundColor: "#0D0D0D",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  proofModalImage: {
    width: "100%",
    height: 400,
    marginBottom: theme.spacing.md,
  },
  modalCloseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  slideModalCard: {
    backgroundColor: ADMIN_SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryText,
    marginBottom: theme.spacing.md,
  },
  modalSummary: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  modalInput: {
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.primaryText,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: theme.spacing.sm,
  },
  charCount: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: theme.spacing.sm,
  },
  modalError: {
    fontSize: 13,
    color: colors.error,
    marginBottom: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primaryText,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primaryAccent,
    alignItems: "center",
  },
  modalConfirmDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  modalRejectBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  modalRejectBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryText,
  },
});
