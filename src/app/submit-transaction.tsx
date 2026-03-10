import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useQuery } from '@tanstack/react-query';

const COLORS = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  accent: '#AAFF00',
  primaryText: '#FFFFFF',
  secondaryText: '#888888',
  border: '#2A2A2A',
  error: '#FF4444',
  warning: '#F0B429',
  uploadBoxBg: '#111111',
};

interface RateResponse {
  rate?: number;
}

export default function SubmitTransactionScreen() {
  const router = useRouter();
  const { coin = 'USDT', network = 'TRC20', amount: amountParam = '' } = useLocalSearchParams<{
    coin?: string;
    network?: string;
    amount?: string;
  }>();

  const [amount, setAmount] = useState(amountParam || '');
  const [proofImage, setProofImage] = useState<{ uri: string } | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const coinSymbol = (coin || 'USDT').toUpperCase();
  const coinId = coinSymbol.toLowerCase();

  const { data: rateData } = useQuery({
    queryKey: ['rate', coinId],
    queryFn: async () => {
      try {
        const res = await api.get<RateResponse>(`/rate?coin=${coinId}`);
        return { rate: res.data?.rate ?? 0 };
      } catch {
        return { rate: 0 };
      }
    },
  });

  const rate = rateData?.rate ?? 0;
  const amountNum = useMemo(() => parseFloat(amount.replace(/,/g, '')) || 0, [amount]);
  const amountNaira = useMemo(() => (rate && amountNum > 0 ? amountNum * rate : 0), [rate, amountNum]);
  const amountNairaDisplay = amountNaira > 0 ? formatCurrency(amountNaira, 'NGN', true) : '—';

  const canSubmit = amountNum > 0 && proofImage !== null;

  const pickImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to upload a screenshot.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setProofImage({ uri: result.assets[0].uri });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photo library. Please try again.');
    }
  };

  const removeImage = () => setProofImage(null);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('coin', coinSymbol);
      formData.append('network', network || '');
      formData.append('amountCrypto', String(amountNum));
      formData.append('amountNaira', String(Math.ceil(amountNaira)));
      formData.append('rateAtTime', String(rate));
      if (transactionHash.trim()) formData.append('transactionHash', transactionHash.trim());

      if (proofImage?.uri) {
        const filename = proofImage.uri.split('/').pop() || 'proof.jpg';
        const match = /\.(jpe?g|png|webp)$/i.exec(filename);
        const mime = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        formData.append('proofImage', {
          uri: proofImage.uri,
          name: filename,
          type: mime,
        } as unknown as Blob);
      }

      await api.post('/transactions', formData);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit. Please try again.';
      setSubmitError(typeof message === 'string' ? message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessAndGoToHistory = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)/history');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primaryText} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>Submit Proof</Text>
              <Text style={styles.subtitle}>Tell us about your transaction</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Coin</Text>
              <Text style={styles.value}>{coinSymbol}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Network</Text>
              <Text style={styles.value}>{network}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Amount Sent</Text>
            </View>
            <View style={styles.amountInputWrap}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.secondaryText}
                keyboardType="decimal-pad"
              />
              <Text style={styles.amountSuffix}>{coinSymbol}</Text>
            </View>
            <View style={[styles.row, styles.rowTop]}>
              <Text style={styles.label}>You Will Receive</Text>
              <Text style={styles.valueAccent}>{amountNairaDisplay}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upload Transaction Screenshot</Text>
            <Text style={styles.cardSubtitle}>
              Take a screenshot of your sent transaction from your wallet app
            </Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={proofImage ? undefined : pickImage}
              activeOpacity={0.8}
            >
              {proofImage ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: proofImage.uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeBtn} onPress={removeImage} hitSlop={8}>
                    <Ionicons name="close-circle" size={32} color={COLORS.primaryText} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={48} color={COLORS.secondaryText} />
                  <Text style={styles.uploadText}>Tap to upload screenshot</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Transaction Hash</Text>
              <Text style={styles.optional}>(Optional)</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Paste your transaction ID/hash for faster verification
            </Text>
            <TextInput
              style={styles.hashInput}
              value={transactionHash}
              onChangeText={setTransactionHash}
              placeholder="e.g. 0x1234abcd..."
              placeholderTextColor={COLORS.secondaryText}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>⚠️ Before submitting</Text>
            <Text style={styles.noticeText}>
              Make sure you have actually sent the crypto to our wallet address
            </Text>
            <Text style={styles.noticeText}>Fake submissions will result in account suspension</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || isSubmitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Transaction</Text>
            )}
          </TouchableOpacity>

          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>✅</Text>
            <Text style={styles.modalTitle}>Transaction Submitted!</Text>
            <Text style={styles.modalMessage}>
              We will verify your payment and send Naira to your bank account within 30 minutes
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={closeSuccessAndGoToHistory}
              activeOpacity={0.9}
            >
              <Text style={styles.modalBtnText}>View Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { marginRight: 12 },
  headerText: {},
  title: { fontSize: 24, fontWeight: '700', color: COLORS.primaryText },
  subtitle: { fontSize: 14, color: COLORS.secondaryText, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primaryText, marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  optional: { fontSize: 12, color: COLORS.secondaryText, marginLeft: 6, fontWeight: '400' },
  cardSubtitle: { fontSize: 13, color: COLORS.secondaryText, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowTop: { marginTop: 4, marginBottom: 0 },
  label: { fontSize: 14, color: COLORS.secondaryText },
  value: { fontSize: 14, fontWeight: '600', color: COLORS.primaryText },
  valueAccent: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.primaryText,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  amountSuffix: { fontSize: 14, fontWeight: '600', color: COLORS.secondaryText, marginLeft: 8 },
  uploadBox: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.uploadBoxBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { fontSize: 14, color: COLORS.secondaryText, marginTop: 12 },
  previewWrap: { width: '100%', height: '100%', position: 'relative', borderRadius: 10, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 8, right: 8 },
  hashInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: COLORS.primaryText,
  },
  noticeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: COLORS.warning, marginBottom: 8 },
  noticeText: { fontSize: 12, color: COLORS.secondaryText, marginBottom: 4 },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: COLORS.secondaryText, opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#000000' },
  errorText: { fontSize: 14, color: COLORS.error, marginTop: 12, textAlign: 'center' },
  bottomSpacer: { height: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalEmoji: { fontSize: 48, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primaryText, marginBottom: 12, textAlign: 'center' },
  modalMessage: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 16, fontWeight: '700', color: '#000000' },
});
