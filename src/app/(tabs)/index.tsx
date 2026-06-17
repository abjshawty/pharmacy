import { Camera, Map as MapLibreMap } from '@maplibre/maplibre-react-native';
import { StyleSheet, View } from 'react-native';

const ABIDJAN_CENTER: [number, number] = [-4.0083, 5.3599];
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapLibreMap style={styles.map} mapStyle={STYLE_URL}>
        <Camera initialViewState={{ center: ABIDJAN_CENTER, zoom: 14 }} />
      </MapLibreMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
