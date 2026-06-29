import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { toDialable } from '@/lib/format';

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pharmacy = useQuery(api.pharmacies.get, { id: id as Id<'pharmacies'> });
  const duty = useQuery(api.onDuty.onDutyNow, {});

  if (pharmacy === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (pharmacy === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Pharmacy not found</Text>
      </View>
    );
  }

  // Whether this pharmacy is on the current duty rotation (same query the
  // on-duty tab uses, checked client-side).
  const dutyEntry = duty?.pharmacies.find((p) => p._id === pharmacy._id);
  const phone = pharmacy.phone;

  const openDirections = () => {
    const { lat, lng, name } = pharmacy;
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: pharmacy.name }} />

      {dutyEntry ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>On duty now</Text>
        </View>
      ) : null}

      <Text style={styles.name}>{pharmacy.name}</Text>
      {pharmacy.commune ? <Text style={styles.commune}>{pharmacy.commune}</Text> : null}
      <Text style={styles.address}>{pharmacy.address}</Text>

      {dutyEntry?.contactName ? (
        <Text style={styles.contact}>Pharmacist on duty: {dutyEntry.contactName}</Text>
      ) : null}
      {pharmacy.hours ? <Text style={styles.hours}>{pharmacy.hours}</Text> : null}

      <View style={styles.actions}>
        {phone ? (
          <Pressable
            style={styles.button}
            onPress={() => Linking.openURL(`tel:${toDialable(phone)}`)}>
            <Text style={styles.buttonText}>Call</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.button, styles.secondary]} onPress={openDirections}>
          <Text style={styles.buttonText}>Directions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 6 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#60646C' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E7F7EE',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  badgeText: { color: '#117A4E', fontWeight: '600', fontSize: 13 },
  name: { fontSize: 22, fontWeight: '700' },
  commune: { fontSize: 15, color: '#60646C' },
  address: { fontSize: 15, color: '#3A3F45', marginTop: 4 },
  contact: { fontSize: 14, color: '#117A4E', marginTop: 8 },
  hours: { fontSize: 14, color: '#60646C', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: {
    flex: 1,
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondary: { backgroundColor: '#3A3F45' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
