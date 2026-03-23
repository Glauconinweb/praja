import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../services/useActions";

// 🔥 TIPAGEM CORRETA
type Produto = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria?: string;
  subcategoria?: string; // 👈 já preparado pro futuro
};

export default function FazerPedido() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const lojaIdParam = params.lojaId;
  const lojaId = Array.isArray(lojaIdParam)
    ? lojaIdParam[0]
    : lojaIdParam;

  const [loja, setLoja] = useState<{ nome: string; produtos: Produto[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const [carrinho, setCarrinho] = useState<
    { produto: Produto; quantidade: number }[]
  >([]);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todas");

  

  useEffect(() => {
    async function buscarLoja() {
      try {
        const response = await fetch(`${API_URL}/lojas/${lojaId}`);
        const data = await response.json();

        if (response.ok) {
          setLoja(data);
        } else {
          Alert.alert("Erro", "Loja não encontrada");
          router.back();
        }
      } catch (error) {
        Alert.alert("Erro", "Falha ao carregar loja");
      } finally {
        setLoading(false);
      }
    }

    if (lojaId) buscarLoja();
  }, [lojaId]);

  function adicionarAoCarrinho(produto: Produto) {
    if (produto.quantidade <= 0) return;

    const existe = carrinho.find((i) => i.produto.id === produto.id);

    if (existe) {
      if (existe.quantidade >= produto.quantidade) {
        return Alert.alert("Limite", "Estoque máximo atingido");
      }

      setCarrinho((prev) =>
        prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setCarrinho((prev) => [...prev, { produto, quantidade: 1 }]);
    }
  }

  function removerDoCarrinho(produtoId: string) {
    setCarrinho((prev) =>
      prev
        .map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  const total = carrinho.reduce(
    (acc, item) => acc + item.produto.preco * item.quantidade,
    0
  );

  // ✅ CORRIGIDO (SEM ERRO DE TYPE)
  const categorias = loja
    ? [
        "Todas",
        ...Array.from(
          new Set(
            loja.produtos
              .map((p) => p.categoria)
              .filter((cat): cat is string => !!cat)
          )
        ),
      ]
    : ["Todas"];

  const produtosFiltrados = loja
    ? loja.produtos.filter((p) => {
        const matchBusca = p.nome
          .toLowerCase()
          .includes(busca.toLowerCase());

        const matchCategoria =
          categoriaAtiva === "Todas" ||
          p.categoria?.toLowerCase().trim() ===
            categoriaAtiva.toLowerCase().trim();

        return matchBusca && matchCategoria;
      })
    : [];

  async function finalizarPedido() {
    if (carrinho.length === 0) {
      return Alert.alert("Erro", "Carrinho vazio");
    }

    for (const item of carrinho) {
      if (item.quantidade > item.produto.quantidade) {
        return Alert.alert(
          "Erro",
          `Estoque insuficiente para ${item.produto.nome}`
        );
      }
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lojaId,
          itens: carrinho.map((item) => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Pedido realizado!");
        setCarrinho([]);
        setCategoriaAtiva("Todas");
        setBusca("");
      } else {
        Alert.alert("Erro", data.message);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar pedido");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ee3f0a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{loja?.nome}</Text>

      <TextInput
        placeholder="Buscar produto..."
        style={styles.input}
        value={busca}
        onChangeText={setBusca}
      />

      {/* 🔥 CATEGORIAS */}
      <FlatList
        horizontal
        data={categorias}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoria,
              categoriaAtiva === item && styles.categoriaAtiva,
            ]}
            onPress={() => setCategoriaAtiva(item)}
          >
            <Text
              style={{
                color: categoriaAtiva === item ? "#fff" : "#000",
              }}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 🔥 PRODUTOS */}
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.produto}>
            <Text>{item.nome}</Text>
            <Text>R$ {item.preco}</Text>
            <Text style={{ fontSize: 11 }}>
              {item.quantidade} disponíveis
            </Text>

            <TouchableOpacity
              onPress={() => adicionarAoCarrinho(item)}
              style={styles.btn}
            >
              <Text style={{ color: "#fff" }}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* 🔥 FOOTER */}
      <View style={styles.footer}>
        <Text>Total: R$ {total.toFixed(2)}</Text>

        <TouchableOpacity style={styles.btnFinalizar} onPress={finalizarPedido}>
          <Text style={{ color: "#fff" }}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  categoria: {
    padding: 10,
    backgroundColor: "#eee",
    marginRight: 5,
    borderRadius: 20,
  },

  categoriaAtiva: {
    backgroundColor: "#ee3f0a",
  },

  produto: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  btn: {
    backgroundColor: "#ee3f0a",
    padding: 8,
    marginTop: 5,
    borderRadius: 5,
    alignItems: "center",
  },

  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  btnFinalizar: {
    backgroundColor: "#ee3f0a",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});