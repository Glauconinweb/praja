import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:5001/api";

export default function PedidosScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) {
        setLoading(false);
        return;
      }
      const user = JSON.parse(userJson);
      setUsuario(user);

      const response = await fetch(`${API_URL}/pedidos/usuario/${user.id}`);
      const data = await response.json();
      setPedidos(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function abrirChat(pedido) {
    try {
      const response = await fetch(`${API_URL}/chat/pedido/${pedido.id}`);
      const chat = await response.json();
      
      const nomeOutro = usuario.tipo === "cliente" ? pedido.loja.nome : pedido.cliente.nome;
      
      router.push({
        pathname: "/chat",
        params: { 
          chatId: chat.id, 
          pedidoId: pedido.id,
          nomeOutro: nomeOutro
        }
      });
    } catch (error) {
      console.error("Erro ao abrir chat:", error);
    }
  }

  const renderPedido = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.lojaNome}>{item.loja.nome}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.dataText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      
      <View style={styles.itensContainer}>
        {item.itens.map((i, idx) => (
          <Text key={idx} style={styles.itemText}>
            {i.quantidade}x {i.produto.nome}
          </Text>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalText}>Total: R$ {item.total.toFixed(2)}</Text>
        
        {item.status !== "entregue" && item.status !== "cancelado" && (
          <TouchableOpacity style={styles.chatBtn} onPress={() => abrirChat(item)}>
            <Feather name="message-circle" size={20} color="#fff" />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  function getStatusColor(status) {
    switch (status) {
      case "pendente": return "#f39c12";
      case "preparando": return "#3498db";
      case "em_rota": return "#9b59b6";
      case "entregue": return "#2ecc71";
      case "cancelado": return "#e74c3c";
      default: return "#95a5a6";
    }
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#ee3f0aff" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Meus Pedidos</Text>
      </View>
      
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderPedido}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.vazio}>Você ainda não fez nenhum pedido.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    backgroundColor: "#ee3f0aff",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  lista: { padding: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lojaNome: { fontSize: 18, fontWeight: "bold", color: "#333" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  dataText: { fontSize: 12, color: "#999", marginTop: 4 },
  itensContainer: { marginVertical: 10, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
  itemText: { fontSize: 14, color: "#666" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  chatBtn: {
    backgroundColor: "#ee3f0aff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatBtnText: { color: "#fff", marginLeft: 8, fontWeight: "bold" },
  vazio: { textAlign: "center", marginTop: 50, color: "#999" },
});
