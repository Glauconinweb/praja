import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  emEstoque: boolean;
}

export default function GerenciarEstoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      const userJson = await AsyncStorage.getItem("user");

      // VERIFICAÇÃO CRÍTICA: Se não houver usuário, não faça o fetch
      if (!userJson) {
        console.log("Aguardando carregamento do usuário...");
        return;
      }

      const user = JSON.parse(userJson);

      // Se o objeto existe mas o id não, também paramos aqui
      if (!user.id) {
        console.error("ID do usuário não encontrado no objeto salvo.");
        return;
      }

      const url = `${process.env.EXPO_PUBLIC_API_URL}/produtos/vendedor/${user.id}`;
      console.log("Buscando produtos do vendedor:", user.id); // Debug

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setProdutos(data);
      }
    } catch (error) {
      console.error("Erro no fetch:", error);
    } finally {
      setLoading(false);
    }
  }
  async function alterarQuantidade(produtoId: string, novaQtd: number) {
    if (novaQtd < 0) return;

    setAtualizandoId(produtoId);
    try {
      // AJUSTE AQUI: A ordem deve ser /estoque/id para bater com o backend
      const url = `${process.env.EXPO_PUBLIC_API_URL}/produtos/estoque/${produtoId}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: novaQtd }),
      });

      if (response.ok) {
        setProdutos((prev) =>
          prev.map((p) =>
            p.id === produtoId
              ? { ...p, quantidade: novaQtd, emEstoque: novaQtd > 0 }
              : p,
          ),
        );
      } else {
        const data = await response.json();
        Alert.alert("Erro", data.message || "Erro ao atualizar estoque.");
      }
    } catch (error) {
      Alert.alert("Erro", "Servidor offline.");
    } finally {
      setAtualizandoId(null);
    }
  }

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text
          style={[
            styles.status,
            { color: item.emEstoque ? "#2ecc71" : "#e74c3c" },
          ]}
        >
          {item.emEstoque ? "Em estoque" : "Esgotado"}
        </Text>
      </View>

      <View style={styles.controles}>
        <TouchableOpacity
          style={styles.btnMenos}
          onPress={() => alterarQuantidade(item.id, item.quantidade - 1)}
          disabled={atualizandoId === item.id || item.quantidade === 0}
        >
          <Feather name="minus" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.qtdBox}>
          {atualizandoId === item.id ? (
            <ActivityIndicator size="small" color="#ee3f0aff" />
          ) : (
            <Text style={styles.qtdText}>{item.quantidade}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.btnMais}
          onPress={() => alterarQuantidade(item.id, item.quantidade + 1)}
          disabled={atualizandoId === item.id}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Estoque</Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#ee3f0aff"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id}
          renderItem={renderProduto}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              Nenhum produto cadastrado.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 20,
    paddingTop: 60,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  info: { flex: 1 },
  nome: { fontSize: 16, fontWeight: "bold", color: "#444" },
  status: { fontSize: 12, marginTop: 4, fontWeight: "600" },
  controles: { flexDirection: "row", alignItems: "center" },
  btnMenos: { backgroundColor: "#ccc", padding: 8, borderRadius: 6 },
  btnMais: { backgroundColor: "#ee3f0aff", padding: 8, borderRadius: 6 },
  qtdBox: { width: 45, alignItems: "center" },
  qtdText: { fontSize: 18, fontWeight: "bold" },
});
