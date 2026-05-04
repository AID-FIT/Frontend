import { Platform } from 'react-native';

export const shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.03,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 24,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
} as const;
