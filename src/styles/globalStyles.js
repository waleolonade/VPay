// Global styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexRow: {
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenPadding: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
