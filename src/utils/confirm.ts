import { Alert, Platform } from 'react-native';

type Btn = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export function confirm(title: string, message: string | undefined, buttons: Btn[]) {
  if (Platform.OS === 'web') {
    const confirmBtn = buttons.find((b) => b.style !== 'cancel');
    const text = message ? `${title}\n\n${message}` : title;
    if (window.confirm(text)) {
      confirmBtn?.onPress?.();
    } else {
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      cancelBtn?.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, buttons);
}