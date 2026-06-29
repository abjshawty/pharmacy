import { StyleSheet, Text, View } from 'react-native';

// Web fallback for the map screen. MapLibre (`@maplibre/maplibre-react-native`)
// is a native-only module and calls `codegenNativeComponent`, which
// react-native-web does not provide — importing it would break the web bundle.
// Pharmacy Finder is Android-only, so web just shows a placeholder. Metro picks
// this `.web.tsx` variant automatically; the native build uses `index.tsx`.
export default function MapScreenWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map unavailable on web</Text>
      <Text style={styles.subtitle}>
        The interactive map runs only in the Android app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});
