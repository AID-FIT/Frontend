export const typography = {
  hero: 48,
  title: 36,
  heading: 28,
  subheading: 22,
  body: 16,
  label: 14,
  caption: 14,
  small: 12,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  heavy: 'Pretendard-ExtraBold',
} as const;

export const letterSpacing = {
  hero: -1,
  heading: -0.5,
  normal: 0,
} as const;
