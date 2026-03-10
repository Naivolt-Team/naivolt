import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, theme } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'error' | 'pending';
  style?: ViewStyle;
}

export default function Badge({
  label,
  variant = 'default',
  style,
}: BadgeProps) {
  const variantStyles = {
    default: { bg: colors.surface, text: colors.primaryText },
    success: { bg: colors.success, text: colors.buttonTextOnAccent },
    error: { bg: colors.error, text: colors.primaryText },
    pending: { bg: colors.pending, text: colors.buttonTextOnAccent },
  };
  const { bg, text } = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.badge,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
