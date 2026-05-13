import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

export function OrderListSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Skeleton width="50%" height={18} />
            <Skeleton width={80} height={20} borderRadius={12} />
          </View>
          <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
          <View style={styles.cardFooter}>
            <Skeleton width={100} height={12} />
            <Skeleton width={120} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});