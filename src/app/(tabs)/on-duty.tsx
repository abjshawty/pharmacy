import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../../../convex/_generated/api';
import { useUserLocation } from '@/hooks/use-user-location';
import { formatDistance, toDialable } from '@/lib/format';
import { haversineMeters } from '@/lib/geo';

const SAMU_NUMBER = '143';

export default function OnDutyScreen() {
  const router = useRouter();
  const { origin } = useUserLocation();
  const data = useQuery(api.onDuty.onDutyNow, {});

  if (data === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Tag with distance from the user (when known) and sort nearest-first.
  const rows = data.pharmacies
    .map((p) => ({
      ...p,
      distanceM: origin ? haversineMeters(origin[1], origin[0], p.lat, p.lng) : null,
    }))
    .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));

  if (rows.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No duty pharmacies found</Text>
        <Pressable
          style={styles.samuButton}
          onPress={() => Linking.openURL(`tel:${SAMU_NUMBER}`)}>
          <Text style={styles.samuText}>Call SAMU ({SAMU_NUMBER})</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const phone = item.phone;
        return (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({ pathname: '/pharmacy/[id]', params: { id: item._id } })
            }>
            <View style={styles.rowInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {[item.commune, item.distanceM != null ? formatDistance(item.distanceM) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {phone ? <Text style={styles.phone}>{phone}</Text> : null}
            </View>
            {phone ? (
              <Pressable
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${toDialable(phone)}`)}>
                <Text style={styles.callText}>Call</Text>
              </Pressable>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 16, color: '#60646C' },
  samuButton: {
    backgroundColor: '#E5484D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  samuText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  list: { padding: 12, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#60646C' },
  phone: { fontSize: 13, color: '#208AEF', marginTop: 2 },
  callButton: {
    backgroundColor: '#208AEF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  callText: { color: '#FFFFFF', fontWeight: '600' },
});
