export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  safe: string;
  warning: string;
  danger: string;
  overlaySoft: string;
  cardHighlight: [string, string];
  iconMuted: string;
}

export const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#111827',
  surfaceSecondary: '#1F2937',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  safe: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  overlaySoft: 'rgba(15, 23, 42, 0.5)',
  cardHighlight: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'],
  iconMuted: '#94A3B8',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: 'rgba(0,0,0,0.06)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  safe: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
  overlaySoft: 'rgba(148, 163, 184, 0.22)',
  cardHighlight: ['rgba(255,255,255,0.88)', 'rgba(255,255,255,0)'],
  iconMuted: '#64748B',
};

export function getThemeColors(mode: ResolvedThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}
