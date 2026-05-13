import Toast from 'react-native-toast-message';

export const toast = {
  success(text: string, subtitle?: string) {
    Toast.show({
      type: 'success',
      text1: text,
      text2: subtitle,
      position: 'top',
      visibilityTime: 2500,
    });
  },
  error(text: string, subtitle?: string) {
    Toast.show({
      type: 'error',
      text1: text,
      text2: subtitle,
      position: 'top',
      visibilityTime: 3500,
    });
  },
  info(text: string, subtitle?: string) {
    Toast.show({
      type: 'info',
      text1: text,
      text2: subtitle,
      position: 'top',
      visibilityTime: 2500,
    });
  },
};