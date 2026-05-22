import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export function SheetHeader({ title }: { title: string }) {
  return (
    <View style={styles.headerBar}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 28 : 14,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f7',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
});