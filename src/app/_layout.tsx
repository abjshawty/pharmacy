import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Single client for the app. On a physical device, http://127.0.0.1:3210 reaches
// the local Convex backend via `adb reverse tcp:3210 tcp:3210` (see HANDOFF.md).
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pharmacy/[id]" options={{ title: '' }} />
        </Stack>
      </GestureHandlerRootView>
    </ConvexProvider>
  );
}
