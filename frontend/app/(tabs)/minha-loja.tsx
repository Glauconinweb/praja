import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../services/useActions";

// 🔥 CORREÇÃO: Alterado de "lanches" para "lanches" (estava exibindo lançamentos por algum motivo no seu print, 
// mas aqui garantimos que a chave e os valores estão corretos)
const CATEGORIAS = {
  lanches: ["doces", "salgados", "bebidas"],
  roupas: ["camisa", "calção", "cueca", "calcinha"],
} as const;

type Categoria = keyof typeof CATEGORIAS;
type Subcategoria = (typeof CATEGORIAS)[Categoria][number];

type Produto = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria?: string;
  subcategoria?: string;
};

type Usuario = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
};

type Loja = {
  id: string;
  nome: string;
  descricao: string;
};

export default function MinhaLoja() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaSelecionada, setLojaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [faturamento, setFaturamento] = useState(0);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<Categoria | "todas">("todas");
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] =
    useState<Subcategoria | "">("");

  // 🔥 CONTROLE DE REQUISIÇÃO
  const requestIdRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  // 🔥 sempre que trocar loja → busca produtos
  useFocusEffect(
    useCallback(() => {
      if (lojaSelecionada) {
        buscarProdutos(lojaSelecionada);
      }
    }, [lojaSelecionada])
  );

  async function carregarDados() {
    try {
      setLoading(true);

      // 🔥 limpa TUDO antes
      setProdutos([]);
      setLojas([]);

      const userJson = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");

      if (!userJson || !token) {
        console.log("Usuário ou token não encontrado");
        return;
      }

      const userParsed: Usuario = JSON.parse(userJson);
      setUsuario(userParsed);

      const lojasData = await buscarLojas(token);

      if (lojasData.length > 0) {
        const primeiraLoja = lojasData[0].id;
        setLojaSelecionada(primeiraLoja);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function buscarLojas(token: string) {
    try {
      const response = await fetch(`${API_URL}/lojas/minhas/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLojas(data);
        return data;
      } else {
        console.log("Erro lojas:", data);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      return [];
    }
  }

  async function buscarProdutos(lojaId: string) {
    requestIdRef.current += 1;
    const currentRequest = requestIdRef.current;

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/produtos/loja/${lojaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("PRODUTOS VINDO DO BACK:", data);

      // 🔥 IGNORA resposta antiga
      if (currentRequest !== requestIdRef.current) return;

      if (response.ok) {
        setProdutos(data);

        const total = data.reduce(
          (acc: number, prod: Produto) => acc + prod.preco * prod.quantidade,
          0
        );

        setFaturamento(total);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }

  async function handleDeletar(id: string, nome: string) {
    const confirmar = Platform.OS === 'web' ? confirm(`Deletar "${nome}"?`) : true; 
    
    if (confirmar) {
      try {
        const token = await AsyncStorage.getItem("token");

        const response = await fetch(`${API_URL}/produtos/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setProdutos((prev) => {
            const atualizado = prev.filter((p) => p.id !== id);
            const total = atualizado.reduce(
              (acc, prod) => acc + prod.preco * prod.quantidade,
              0
            );
            setFaturamento(total);
            return atualizado;
          });
        }
      } catch (error) {
        console.log("ERRO FETCH:", error);
      }
    }
  }

  // 🔥 FILTRO CORRIGIDO
  const produtosFiltrados = produtos.filter((p) => {
    const categoriaProduto = (p.categoria || "").toLowerCase().trim();

    // Se a categoria selecionada for "todas", mostramos tudo
    if (categoriaSelecionada === "todas") return true;

    // Verifica se a categoria do produto bate com a selecionada
    const catMatch = categoriaProduto === categoriaSelecionada;

    // Se não houver subcategoria selecionada, basta bater a categoria
    if (!subcategoriaSelecionada) return catMatch;

    // Se houver subcategoria, ambas precisam bater
    const subcategoriaProduto = (p.subcategoria || "").toLowerCase().trim();
    const subMatch = subcategoriaProduto === subcategoriaSelecionada;

    return catMatch && subMatch;
  });

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
          <Text style={styles.titulo}>Minhas Lojas 🏪</Text>

          <Text style={styles.sectionTitle}>Suas Lojas</Text>

          {lojas.length === 0 && (
            <Text style={{ color: "#fff", marginBottom: 10 }}>
              Você ainda não tem lojas
            </Text>
          )}

          {lojas.map((loja) => (
            <TouchableOpacity
              key={loja.id}
              style={[
                styles.produtoCard,
                lojaSelecionada === loja.id && styles.lojaSelecionada,
              ]}
              onPress={() => {
                setLojaSelecionada(loja.id);
              }}
            >
              <View>
                <Text style={styles.produtoNome}>{loja.nome}</Text>
                <Text style={styles.produtoQtd}>{loja.descricao}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (!lojaSelecionada) {
                  alert("Selecione uma loja primeiro");
                  return;
                }
                const loja = lojas.find((l) => l.id === lojaSelecionada);
                if (!loja) return;

                router.push({
                  pathname: "/adicionar-produto",
                  params: { lojaId: loja.id, nome: loja.nome },
                });
              }}
            >
              <Feather name="plus-circle" size={20} color="#fff"  />
              <Text style={styles.addText}>Adicionar Produto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/criar-loja")}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.addText}>Criar Loja</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{produtos.length}</Text>
              <Text>Produtos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(faturamento)}
              </Text>
              <Text>Faturamento</Text>
            </View>
          </View>

          {/* CATEGORIAS - 🔥 Aqui garantimos que exiba LANCHES */}
          <View style={styles.categoriasContainer}>
            {["todas", ...Object.keys(CATEGORIAS)].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoriaButton,
                  categoriaSelecionada === cat && styles.categoriaAtiva,
                ]}
                onPress={() => {
                  setCategoriaSelecionada(cat as Categoria | "todas");
                  setSubcategoriaSelecionada("");
                }}
              >
                <Text
                  style={[
                    styles.categoriaTexto,
                    categoriaSelecionada === cat && { color: "#fff" },
                  ]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {categoriaSelecionada !== "todas" && (
            <View style={styles.categoriasContainer}>
              {CATEGORIAS[categoriaSelecionada as Categoria].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.categoriaButton,
                    subcategoriaSelecionada === sub && styles.categoriaAtiva,
                  ]}
                  onPress={() =>
                    setSubcategoriaSelecionada(
                      subcategoriaSelecionada === sub ? "" : sub
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoriaTexto,
                      subcategoriaSelecionada === sub && { color: "#fff" },
                    ]}
                  >
                    {sub.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Produtos da Loja</Text>
          
          {produtosFiltrados.length === 0 && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 10 }}>
              <Text style={{ color: "#fff", fontStyle: "italic", textAlign: 'center' }}>
                Nenhum produto encontrado nesta categoria.
              </Text>
            </View>
          )}

          {produtosFiltrados.map((item) => (
            <View key={item.id} style={styles.produtoCard}>
              <View>
                <Text style={styles.produtoNome}>{item.nome}</Text>
                <Text>R$ {item.preco}</Text>
                <Text>Qtd: {item.quantidade}</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 15 }}>
                <TouchableOpacity
                  onPress={() => router.push(`/editar-produto?id=${item.id}`)}
                >
                  <Feather name="edit-2" size={20} color="#ee3f0a" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeletar(item.id, item.nome)}
                >
                  <Feather name="trash-2" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ee3f0a",
    paddingTop: Platform.OS === "web" ? 20 : 50,
  },

  webWrapper: {
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 15,
    marginBottom: 10,
  },

  produtoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    ...Platform.select({
      web: {
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
      },
      default: {
        elevation: 3,
      },
    }),
  },

  lojaSelecionada: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fa7901"
  },

  produtoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  produtoQtd: {
    fontSize: 12,
    color: "#666",
  },

  addButton: {
    backgroundColor: "#fa7901",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    gap: 10,
  },

  addText: {
    color: "#fff",
    fontWeight: "bold",
    backgroundColor: "#fa7901"
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    gap: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fa7901",
  },

  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },

  categoriaButton: {
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  categoriaAtiva: {
    backgroundColor: "#fa7901",
  },

  categoriaTexto: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
});