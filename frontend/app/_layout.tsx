import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      
      {/* Tabs (principal) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Autenticação */}
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />

      {/* Outras telas fora das tabs */}
      <Stack.Screen name="adicionar-produto" />

      {/* ⚠️ pode remover isso se quiser */}
      <Stack.Screen name="index" />

    </Stack>
  );
}