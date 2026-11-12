import type { TextStyle } from 'react-native';

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label';

// Explicit font family names per static .ttf file so Android never guesses weights.
export const typography: Record<TypographyVariant, TextStyle> = {
  display: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 34,
    lineHeight: 40,
  },
  title: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
  heading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
};
