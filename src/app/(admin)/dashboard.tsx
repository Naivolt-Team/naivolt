import { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, theme } from "@/constants/theme";
import StatusBadge from "@/components/transaction/StatusBadge";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { useAuthStore } from "@/store/authStore";

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
  status: TransactionStatus;
  createdAt: string;
  transactionHash?: string;
  proofImage?: string;
  user?: {
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

interface AdminStats {
  totalTransactions: number;
  pending: number;
  processing: number;
  paid: number;
  rejected: number;
  totalCryptoPaid: number;
  totalNairaPaid: number;
  totalUsers: number;
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

const FILTER_OPTIONS: { value: "all" | TransactionStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

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

function getStatusBorderColor(status: TransactionStatus): string {
  switch (status) {
    case "pending":
      return PENDING_COLOR;
    case "processing":
      return "#888888";
    case "paid":
      return colors.primaryAccent;
    case "rejected":
      return colors.error;
    default:
      return ADMIN_BORDER;
  }
}

function PulsingDot() {
  const opacity = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View style={[styles.pulsingDot, { opacity }]} />
  );
}

function TransactionSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.txCard, styles.cardSkeleton]}>
          <View style={styles.txCardTop}>
            <View style={[styles.avatarCircle, styles.skeleton]} />
            <View style={styles.txCardTopRight}>
              <View style={[styles.skeleton, styles.skeletonLine]} />
              <View style={[styles.skeleton, styles.skeletonSub]} />
            </View>
            <View style={[styles.skeleton, styles.skeletonTime]} />
          </View>
          <View style={styles.txCardMiddle}>
            <View style={[styles.coinCircleSkeleton, styles.skeleton]} />
            <View style={[styles.skeleton, styles.skeletonAmount]} />
          </View>
          <View style={styles.txCardBottom}>
            <View style={[styles.skeleton, styles.skeletonCrypto]} />
            <View style={[styles.skeleton, styles.skeletonBadge]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"all" | TransactionStatus>("all");
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async (): Promise<AdminStats> => {
      const res = await api.get("/admin/stats");
      return res.data.data;
    },
  });

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["adminTransactions", activeFilter],
    queryFn: async (): Promise<AdminTransaction[]> => {
      const url =
        activeFilter === "all"
          ? "/admin/transactions"
          : `/admin/transactions?status=${activeFilter}`;
      const res = await api.get(url);
      return res.data.data ?? [];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchTransactions()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats, refetchTransactions]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Log Out",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            useAuthStore.getState().logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  }, [router]);

  const handleRetry = useCallback(() => {
    refetchStats();
    refetchTransactions();
  }, [refetchStats, refetchTransactions]);

  const handleTransactionPress = useCallback(
    (id: string) => {
      router.push(`/(admin)/transaction/${id}` as const);
    },
    [router]
  );

  const isError = statsError || transactionsError;
  const showEmpty = !transactionsLoading && transactions.length === 0;

  const emptySubtitle =
    activeFilter === "all"
      ? "No transactions have been submitted yet."
      : `No ${activeFilter} transactions.`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryAccent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>ADMIN PANEL</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={12}>
            <Ionicons name="log-out-outline" size={24} color={colors.secondaryText} />
          </Pressable>
        </View>

        {isError ? (
          <View style={styles.errorBlock}>
            <Ionicons name="alert-circle" size={40} color={colors.error} />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSub}>{"We couldn't load dashboard data."}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <Text style={styles.sectionLabel}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {statsLoading ? "—" : stats?.totalTransactions ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Transactions</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {statsLoading ? "—" : stats?.totalUsers ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: PENDING_COLOR }]}>
                      {statsLoading ? "—" : stats?.pending ?? 0}
                    </Text>
                    {(stats?.pending ?? 0) > 0 && (
                      <View style={styles.pulseWrap}>
                        <PulsingDot />
                      </View>
                    )}
                  </View>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.primaryAccent }]}>
                    {statsLoading ? "—" : stats?.paid ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Paid</Text>
                </View>
              </View>
            </View>

            {/* Revenue card */}
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>TOTAL NAIRA PAID OUT</Text>
              <Text style={styles.revenueValue}>
                {statsLoading ? "—" : formatCurrency(stats?.totalNairaPaid ?? 0, "NGN", true)}
              </Text>
              <Text style={styles.revenueSub}>Across all paid transactions</Text>
            </View>

            {/* Filter tabs */}
            <Text style={styles.sectionLabel}>Transactions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsContent}
            >
              {FILTER_OPTIONS.map((opt) => {
                const isActive = activeFilter === opt.value;
                const showPendingBadge = opt.value === "pending" && (stats?.pending ?? 0) > 0;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.tab, isActive && styles.tabActive]}
                    onPress={() => setActiveFilter(opt.value)}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {opt.label}
                    </Text>
                    {showPendingBadge && (
                      <View style={styles.tabRedDot} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Transactions list */}
            {transactionsLoading ? (
              <TransactionSkeleton />
            ) : showEmpty ? (
              <View style={styles.emptyBlock}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="wallet-outline" size={40} color={colors.secondaryText} />
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySub}>{emptySubtitle}</Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {transactions.map((tx) => {
                  const coin = tx.coin ?? "USDT";
                  const coinColor = getCoinColor(tx.coin);
                  const coinSymbol = getCoinSymbol(tx.coin);
                  const borderColor = getStatusBorderColor(tx.status);
                  return (
                    <Pressable
                      key={tx._id}
                      style={[styles.txCard, { borderLeftColor: borderColor }]}
                      onPress={() => handleTransactionPress(tx._id)}
                    >
                      <View style={styles.txCardTop}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {getInitials(tx.user?.name)}
                          </Text>
                        </View>
                        <View style={styles.txCardTopCenter}>
                          <Text style={styles.userName}>{tx.user?.name ?? "—"}</Text>
                          {tx.user?.username ? (
                            <Text style={styles.userUsername}>@{tx.user.username}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.txTime}>{formatDate(tx.createdAt)}</Text>
                      </View>
                      <View style={styles.txCardMiddle}>
                        <View style={[styles.coinCircle, { backgroundColor: coinColor }]}>
                          <Text style={styles.coinSymbol}>{coinSymbol}</Text>
                        </View>
                        <Text style={styles.coinName}>{coin}</Text>
                        {tx.network ? (
                          <View style={styles.networkBadge}>
                            <Text style={styles.networkText}>{tx.network}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.arrow}>→</Text>
                        <Text style={styles.ngnLabel}>NGN</Text>
                        <Text style={styles.nairaAmount}>
                          {tx.amountNaira != null
                            ? formatCurrency(tx.amountNaira, "NGN", true)
                            : "—"}
                        </Text>
                      </View>
                      <View style={styles.txCardBottom}>
                        <View style={styles.txCardBottomLeft}>
                          <Text style={styles.cryptoAmount}>
                            {tx.amountCrypto != null ? `${tx.amountCrypto} ${coin}` : "—"}
                          </Text>
                          {tx.proofImage ? (
                            <View style={styles.proofPill}>
                              <Text style={styles.proofPillText}>Has Proof</Text>
                            </View>
                          ) : null}
                        </View>
                        <StatusBadge status={tx.status} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryAccent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primaryText,
  },
  logoutBtn: {
    padding: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  statsGrid: {
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: ADMIN_SURFACE,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
    borderRadius: 16,
    padding: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primaryText,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  pulseWrap: {
    marginLeft: 4,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PENDING_COLOR,
  },
  revenueCard: {
    backgroundColor: ADMIN_SURFACE,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryAccent,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primaryAccent,
  },
  revenueSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  tabsScroll: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabsContent: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 4,
  },
  tab: {
    backgroundColor: ADMIN_SURFACE,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.button,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primaryAccent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondaryText,
  },
  tabTextActive: {
    color: colors.buttonTextOnAccent,
    fontWeight: "700",
  },
  tabRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  txList: {
    gap: theme.spacing.sm,
  },
  txCard: {
    backgroundColor: ADMIN_SURFACE,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: ADMIN_BORDER,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardSkeleton: {
    borderLeftColor: ADMIN_BORDER,
  },
  txCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ADMIN_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryAccent,
  },
  txCardTopCenter: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryText,
  },
  userUsername: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  txCardTopRight: {
    flex: 1,
  },
  txTime: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  txCardMiddle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  coinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  coinCircleSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  coinSymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  coinName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primaryText,
  },
  networkBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.badge,
  },
  networkText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  ngnLabel: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  nairaAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primaryAccent,
    marginLeft: 4,
  },
  txCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txCardBottomLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cryptoAmount: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  proofPill: {
    backgroundColor: "rgba(170, 255, 0, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.badge,
  },
  proofPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryAccent,
  },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ADMIN_SURFACE,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryText,
    marginTop: theme.spacing.md,
  },
  emptySub: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  errorBlock: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
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
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: colors.primaryAccent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: theme.borderRadius.button,
    marginTop: theme.spacing.md,
  },
  retryBtnText: {
    color: colors.buttonTextOnAccent,
    fontWeight: "700",
    fontSize: 16,
  },
  skeletonList: {
    gap: theme.spacing.sm,
  },
  skeleton: {
    backgroundColor: ADMIN_BORDER,
  },
  skeletonLine: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },
  skeletonSub: {
    width: 60,
    height: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  skeletonTime: {
    width: 50,
    height: 10,
    borderRadius: 4,
  },
  skeletonAmount: {
    flex: 1,
    height: 14,
    borderRadius: 4,
  },
  skeletonCrypto: {
    width: 80,
    height: 12,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 52,
    height: 22,
    borderRadius: theme.borderRadius.badge,
  },
});
