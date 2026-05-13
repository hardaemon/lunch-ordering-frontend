import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

export function OrderRoomSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={120} height={22} borderRadius={12} />
        <Skeleton width="60%" height={24} style={{ marginTop: 12 }} />
        <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.summary}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="60%" height={20} style={{ marginTop: 12 }} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.itemCard}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  summary: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8 },
});