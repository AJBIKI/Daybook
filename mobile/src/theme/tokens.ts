export interface ColorPalette {
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  line: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  priorityHigh: string;
  priorityMed: string;
  priorityLow: string;
}

export const lightPalette: ColorPalette = {
  bg: '#F5F1EA',
  surface: '#FBF9F5',
  ink: '#16130F',
  inkMuted: '#6B655C',
  line: '#E6E0D5',
  accent: '#1E5A46',
  accentSoft: '#DDEBE3',
  onAccent: '#FFFFFF',
  danger: '#B93A24',
  priorityHigh: '#C8452D',
  priorityMed: '#D99A2B',
  priorityLow: '#5B8A72',
};

export const darkPalette: ColorPalette = {
  bg: '#121110',
  surface: '#1B1A18',
  ink: '#F2EEE6',
  inkMuted: '#A29B90',
  line: '#2A2825',
  accent: '#7CCBA3',
  accentSoft: '#1E3A2F',
  onAccent: '#0E1F18',
  danger: '#F08A75',
  priorityHigh: '#F08A75',
  priorityMed: '#E5B456',
  priorityLow: '#8FC2A8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
} as const;

export const radius = {
  input: 12,
  chip: 12,
  card: 20,
  modalTop: 28,
  pill: 999,
} as const;

export const touchTarget = {
  min: 48,
  control: 52,
  rowMin: 64,
} as const;

export type ThemeMode = 'system' | 'light' | 'dark';
