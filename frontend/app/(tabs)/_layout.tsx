import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ee3f0aff",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height:
            Platform.OS === "web"
              ? 70
              : Platform.OS === "ios"
              ? 85
              : 60,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          ...Platform.select({
            web: {
              boxShadow: "0px -2px 10px rgba(0,0,0,0.1)",
            },
            android: {
              elevation: 10,
            },
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 5,
            },
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-bag" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="minha-loja"
        options={{
          title: "Minha Loja",
          tabBarIcon: ({ color }) => (
            <Feather name="briefcase" size={24} color={color} />
          ),
        }}
      />


      {/* 🔥 TELAS OCULTAS */}
      <Tabs.Screen
        name="editar-produto"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="criar-loja"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}