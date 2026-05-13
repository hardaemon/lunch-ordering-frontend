import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'success' | 'danger';
};

const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  danger: '#FF3B30',
};

export function PrimaryButton({
  title,
  onPress,
  busy,
  disabled,
  style,
  variant = 'primary',
}: Props) {
  const isDisabled = busy || disabled;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: COLORS[variant] },
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  disabled: { opacity: 0.6 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});