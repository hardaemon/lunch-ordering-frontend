import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  ctaTitle?: string;
  onCtaPress?: () => void;
};

export function EmptyState({ icon, title, subtitle, ctaTitle, onCtaPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {ctaTitle && onCtaPress && (
        <PrimaryButton
          title={ctaTitle}
          onPress={onCtaPress}
          style={{ marginTop: 20, paddingHorizontal: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#666', textAlign: 'center', lineHeight: 20 },
});