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
  paddingTop: Platform.OS === 'ios' ? 24 : 14,
  paddingBottom: 14,
  alignItems: 'center',
  backgroundColor: '#f5f5f7',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
},
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
});