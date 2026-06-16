import { StyleSheet, Text, View } from 'react-native';

export default function OnDutyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>On-duty pharmacies — coming in Phase 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#60646C' },
});
