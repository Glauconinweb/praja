import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function MinhaLoja() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.webWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>Painel da Loja 🏪</Text>
          </View>

          {/* Cards de Estatísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Vendas Hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>R$ 0,00</Text>
              <Text style={styles.statLabel}>Faturamento</Text>
            </View>
          </View>

          {/* Menu */}
          <Text style={styles.sectionTitle}>Gerenciar</Text>

          <View style={styles.menuGrid}>
            {/* --- BOTÃO CORRIGIDO (USANDO onPress) --- */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/adicionar-produto")}
            >
              <View style={styles.iconBg}>
                <Feather name="plus-circle" size={24} color="#ee3f0aff" />
              </View>
              <Text style={styles.menuText}>Add Produto</Text>
            </TouchableOpacity>
            {/* --------------------------------------- */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/GerenciarEstoque")}
            >
              <View style={styles.iconBg}>
                <Feather name="package" size={24} color="#ee3f0aff" />
              </View>
              <Text style={styles.menuText}>Estoque</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.iconBg}>
                <Feather name="list" size={24} color="#ee3f0aff" />
              </View>
              <Text style={styles.menuText}>Pedidos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.iconBg}>
                <Feather name="settings" size={24} color="#ee3f0aff" />
              </View>
              <Text style={styles.menuText}>Configurar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ee3f0aff",
    paddingTop: Platform.OS === "web" ? 20 : 50,
  },
  webWrapper: {
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ee3f0aff",
  },
  statLabel: {
    color: "#666",
    marginTop: 5,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    backgroundColor: "#fff",
    width: "48%",
    aspectRatio: 1.3,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
  },
  iconBg: {
    backgroundColor: "rgba(238, 63, 10, 0.1)",
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
  },
  menuText: {
    fontWeight: "600",
    color: "#333",
  },
});
