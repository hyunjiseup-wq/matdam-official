import { Alert, Platform } from 'react-native';

// 웹에서는 RN의 Alert가 동작하지 않으므로 window.confirm/alert로 대체.
// 네이티브에서는 기존 Alert.alert 사용.

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = '확인',
  destructive = false,
) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
