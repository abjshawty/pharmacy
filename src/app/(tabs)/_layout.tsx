import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Map', headerShown: false }} />
      <Tabs.Screen name="on-duty" options={{ title: 'On Duty' }} />
    </Tabs>
  );
}
