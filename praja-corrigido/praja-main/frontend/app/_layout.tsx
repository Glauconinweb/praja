import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />
      <Stack.Screen name="adicionar-produto" />

      <Stack.Screen name="index" />
    </Stack>
  );
}
