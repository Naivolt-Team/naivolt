/**
 * App-wide theme (aligned with Convert tab).
 * Dark background, elevated surfaces, neon lime accent.
 */
export const colors = {
  // Backgrounds
  primaryBackground: '#0A0A0B',
  surface: '#16161A',
  surfaceElevated: '#1C1C21',
  surfaceInput: '#0D0D0F',

  // Accent & interactive
  primaryAccent: '#AAFF00',
  accentDim: 'rgba(170, 255, 0, 0.15)',
  successDim: 'rgba(170, 255, 0, 0.08)',

  // Text
  primaryText: '#F4F4F5',
  secondaryText: '#71717A',
  tertiaryText: '#52525B',
  buttonTextOnAccent: '#000000',

  // Borders & dividers
  border: '#27272A',
  borderLight: '#3F3F46',

  // Status
  success: '#AAFF00',
  error: '#EF4444',
  pending: '#F59E0B',
  paid: '#AAFF00',
} as const;

export type Colors = typeof colors;
