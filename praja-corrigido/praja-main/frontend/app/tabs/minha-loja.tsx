import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem: string | null;
  categoria: string;
};

type Usuario = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
};

export default function MinhaLoja() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [faturamento, setFaturamento] = useState(0);

  // Carrega os dados sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const userParsed = JSON.parse(userJson);
        setUsuario(userParsed);
        await buscarProdutos(userParsed.id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  }

  async function buscarProdutos(vendedorId: string) {
    try {
      const response = await fetch(`http://localhost:5001/api/produtos/vendedor/${vendedorId}`);
      const data = await response.json();
      if (response.ok) {
        setProdutos(data);
        // Cálculo simples de faturamento (soma de todos os produtos: preço * quantidade)
        const total = data.reduce((acc: number, prod: Produto) => acc + (prod.preco * prod.quantidade), 0); 
        setFaturamento(total);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }

  async function handleDeletar(id: string, nome: string) {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja deletar o produto "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:5001/api/produtos/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                Alert.alert("Sucesso", "Produto removido!");
                if (usuario) buscarProdutos(usuario.id);
              } else {
                Alert.alert("Erro", "Não foi possível deletar o produto.");
              }
            } catch (error) {
              Alert.alert("Erro", "Falha na conexão com o servidor.");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.webWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>
              {usuario ? `Loja de ${usuario.nome} 🏪` : "Painel da Loja 🏪"}
            </Text>
          </View>

          {/* Cards de Estatísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{produtos.length}</Text>
              <Text style={styles.statLabel}>Produtos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(faturamento)}
              </Text>
              <Text style={styles.statLabel}>Faturamento</Text>
            </View>
          </View>

          {/* Menu */}
          <Text style={styles.sectionTitle}>Gerenciar</Text>

          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/adicionar-produto")}
            >
              <View style={styles.iconBg}>
                <Feather name="plus-circle" size={24} color="#ee3f0aff" />
              </View>
              <Text style={styles.menuText}>Add Produto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.iconBg}>
                <Feather name="package" size={24} color="#ee3f0aff" />
              </View>
              <Text style={styles.menuText}>Estoque</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push("/tabs/pedidos")}
            >
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

          {/* Lista de Produtos (Estoque Rápido) */}
          <Text style={styles.sectionTitle}>Seu Estoque</Text>
          {produtos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
            </View>
          ) : (
            produtos.map((item) => (
              <View key={item.id} style={styles.produtoCard}>
                <View style={styles.produtoInfo}>
                  <Text style={styles.produtoNome}>{item.nome}</Text>
                  <Text style={styles.produtoPreco}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.preco)}
                  </Text>
                  <Text style={styles.produtoQtd}>Estoque: {item.quantidade}</Text>
                </View>
                
               <View style={styles.actionButtons}>
                <TouchableOpacity 
    style={styles.actionBtn}
    // Usando 'as any' para evitar o erro de tipagem do pathname
    onPress={() => router.push({ pathname: "/tabs/editar-produto", params: { id: item.id } })}
  >
    <Feather name="edit-2" size={20} color="#ee3f0aff" />
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.actionBtn}
    onPress={() => handleDeletar(item.id, item.nome)}
  >
    <Feather name="trash-2" size={20} color="#ff4444" />
  </TouchableOpacity>
</View>

              </View>
            ))
          )}
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
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
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
    fontSize: 20,
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
    marginTop: 10,
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
  produtoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  produtoPreco: {
    fontSize: 14,
    color: "#ee3f0aff",
    fontWeight: "600",
    marginTop: 2,
  },
  produtoQtd: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionBtn: {
    padding: 10,
    marginLeft: 5,
  },
  emptyState: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontStyle: "italic",
  },
});