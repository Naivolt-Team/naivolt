import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, theme } from '@/constants/theme';

const FEATURES = [
  'Send crypto, collect Naira in seconds',
  'Best real-time rates, zero hidden charges',
  'Supports USDT, BTC, ETH and more',
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Ionicons name="flash" size={48} color={colors.primaryAccent} />
          </View>
          <Text style={styles.heading}>
            <Text style={styles.headingLine}>Got Crypto?</Text>
            {'\n'}
            <Text style={styles.headingAccent}>Get Naira.</Text>
          </Text>
          <Text style={styles.subtext}>
            The smartest way to convert crypto to Naira. Fast, simple, secure.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((line, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={colors.buttonTextOnAccent}
              style={styles.buttonArrow}
            />
          </TouchableOpacity>
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [
                styles.loginLinkWrap,
                pressed && styles.loginPressed,
              ]}
            >
              <Text style={styles.loginLink}>Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 1.5,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.md,
    maxWidth: 320,
  },
  headingLine: {
    color: colors.primaryText,
  },
  headingAccent: {
    color: colors.primaryAccent,
  },
  subtext: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    paddingHorizontal: theme.spacing.xs,
  },
  features: {
    paddingVertical: theme.spacing.lg,
    paddingLeft: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryAccent,
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: colors.primaryText,
    fontWeight: '500',
    letterSpacing: 0.1,
    opacity: 0.95,
  },
  footer: {
    paddingTop: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primaryAccent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.button,
    marginBottom: theme.spacing.lg,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.buttonTextOnAccent,
    letterSpacing: 0.3,
  },
  buttonArrow: {
    marginLeft: theme.spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  loginPrompt: {
    fontSize: 15,
    color: colors.secondaryText,
  },
  loginLinkWrap: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
  loginPressed: {
    opacity: 0.8,
  },
});
