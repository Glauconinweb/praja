import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão (já temos o nosso na Dashboard)
        tabBarActiveTintColor: "#ee3f0aff", // Cor Laranja quando ativo
        tabBarInactiveTintColor: "#999", // Cor Cinza quando inativo
        tabBarStyle: {
          backgroundColor: "#fff", // Fundo branco
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 85 : 60, // Altura confortável
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          elevation: 10, // Sombra no Android
          shadowColor: "#000", // Sombra no iOS
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. TELA INÍCIO (Sua Dashboard) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 2. FAVORITOS (Placeholder) */}
      <Tabs.Screen
        name="favoritos" // Você precisará criar favoritos.tsx
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color }) => (
            <Feather name="heart" size={24} color={color} />
          ),
        }}
      />

      {/* 3. PEDIDOS (Placeholder) */}
      <Tabs.Screen
        name="pedidos" // Você precisará criar pedidos.tsx
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-bag" size={24} color={color} />
          ),
        }}
      />

      {/* 4. MINHA LOJA (Painel do Vendedor) */}
      <Tabs.Screen
        name="minha-loja"
        options={{
          title: "Minha Loja",
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-bag" size={24} color={color} />
          ),
        }}
      />

      {/* 5. PERFIL/LOGIN */}
      <Tabs.Screen
        name="perfil" // Você precisará criar perfil.tsx
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
