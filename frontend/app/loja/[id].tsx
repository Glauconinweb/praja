import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
};

export default function Loja() {
  const { id, nome } = useLocalSearchParams();

  // ✅ Corrige id e nome
  const lojaId = Array.isArray(id) ? id[0] : id;
  const lojaNome = Array.isArray(nome) ? nome[0] : nome;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (lojaId) {
      buscarProdutos();
    }
  }, [lojaId]);

  async function buscarProdutos() {
    try {
      setLoading(true);

      const response = await fetch(
        `http://192.168.3.27:5001/api/produtos/loja/${lojaId}`
      );

      const data = await response.json();

      if (response.ok) {
        setProdutos(data);
      } else {
        console.log("Erro do servidor:", data);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // 🔄 puxar pra atualizar (UX melhor)
  const onRefresh = async () => {
    setRefreshing(true);
    await buscarProdutos();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.titulo}>🏪 {lojaNome}</Text>

      {produtos.length === 0 ? (
        <Text style={styles.empty}>Nenhum produto</Text>
      ) : (
        produtos.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.nome}>{p.nome}</Text>
            <Text style={styles.preco}>R$ {p.preco}</Text>
            <Text style={styles.qtd}>Qtd: {p.quantidade}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ee3f0a",
    padding: 20,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 20,
    fontWeight: "bold",
  },
  empty: {
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  nome: {
    fontWeight: "bold",
    fontSize: 16,
  },
  preco: {
    color: "#333",
  },
  qtd: {
    color: "#666",
  },
});