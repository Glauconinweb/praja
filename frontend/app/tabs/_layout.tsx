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
<<<<<<< HEAD
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
=======
>>>>>>> 9a01b8c41e33c12f1bd2770645d32904fbfcb4f8
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: Platform.OS === "web" ? 70 : Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          // Ajuste multiplataforma para sombras
          ...Platform.select({
            web: {
              boxShadow: "0px -2px 10px rgba(0,0,0,0.1)", // Sombra para cima na Web
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
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color }) => <Feather name="heart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="minha-loja"
        options={{
          title: "Minha Loja",
          tabBarIcon: ({ color }) => <Feather name="briefcase" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="editar-produto"
        options={{
          href: null, // Isso esconde a aba do menu inferior
        }}
      />
    </Tabs>
  );
}
