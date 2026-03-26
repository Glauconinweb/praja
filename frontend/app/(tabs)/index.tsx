import React, { useState, useCallback, useEffect } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

type UsuarioData = {
  token: string;
  tipo: string;
  email: string;
};

type Produto = {
  id: string;
  _id?: string; // Para compatibilidade com MongoDB/Render
  nome: string;
  descricao?: string;
  preco: number;
  imagem?: string;
  categoria?: string;
  vendedor?: {
    nome: string;
  };
};

// URL DA SUA API NO RENDER (Substituído localhost por sua URL Live)
// constants.js
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const CATEGORIAS = {
  lanches: [
    {
      nome: "doces",
      imagem: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=80&q=30",
    },
    {
      nome: "salgados",
      imagem: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=80&q=30",
    },
    {
      nome: "bebidas",
      imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=80&q=30",
    }
  ],

  vestimentas: [
    {
      nome: "roupas",
      imagem: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=80&q=30",
    },
    {
      nome: "calcados",
      imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=30",
    },
    {
      nome: "acessorios",
      imagem: "https://images.unsplash.com/photo-1526178613658-3f1622045557?w=80&q=30",
    }
  ],

  casa: [
    {
      nome: "moveis",
      imagem: "https://images.unsplash.com/photo-1582582494700-0b2c0b1b3f0f?w=80&q=30",
    },
    {
      nome: "decoracoes",
      imagem: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=80&q=30",
    },
    {
      nome: "utensilios",
      imagem: "https://images.unsplash.com/photo-1503602642458-232111445657?w=80&q=30",
    }
  ],

  eletronicos: [
    {
      nome: "celulares",
      imagem: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&q=30",
    },
    {
      nome: "informatica",
      imagem: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&q=30",
    },
    {
      nome: "video_games",
      imagem: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=80&q=30",
    },
    {
      nome: "audios_videos",
      imagem: "https://images.unsplash.com/photo-1585386959984-a4155223162d?w=80&q=30",
    }
  ]
}  as const;

type Categoria = keyof typeof CATEGORIAS;
type SubcategoriaNome =
  | "doces"
  | "salgados"
  | "bebidas"
  | "roupas"
  | "calcados"
  | "acessorios"
  | "moveis"
  | "decoracoes"
  | "utensilios"
  | "celulares"
  | "informatica"
  | "video_games"
  | "audios_videos";

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | "Todos">("Todos");
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<SubcategoriaNome | "">("");
  const imagensCategorias: Record<Categoria, string> = {
  lanches: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=80&q=30",
  vestimentas: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=80&q=30",
  eletronicos: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=80&q=30",
  casa: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=80&q=30",
};

  const categorias = (Object.keys(CATEGORIAS) as Categoria[]).map((cat, index) => {
  return {
    id: String(index),
    nome: cat,
    imagem: imagensCategorias[cat] || "https://via.placeholder.com/80",
  };
});

  useFocusEffect(
    useCallback(() => {
      verificarLogin();
    }, []),
  );  

  async function buscarVitrine(termo = "", cat = "Todos", sub = "") {
    try {
      setLoading(true);

      let url = `${API_URL}/busca`;
      const params = [];

      if (termo) params.push(`q=${encodeURIComponent(termo)}`);

      if (cat && cat !== "Todos") {
        params.push(`categoria=${encodeURIComponent(cat)}`);
      }

      if (sub) {
        params.push(`subcategoria=${encodeURIComponent(sub)}`);
      }

      if (params.length > 0) {
        url += "?" + params.join("&");
      } else {
        url = `${API_URL}/produtos/vitrine`;
      }

      const response = await fetch(url);
      const data = await response.json();

      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }

  function otimizarImagem(url?: string, largura = 80) {
    if (!url) return `https://via.placeholder.com/${largura}?q=30`;

    // Remove parâmetros antigos
    const baseUrl = url.split("?")[0];

    return `${baseUrl}?w=${largura}&q=25&auto=format&fit=crop`;
  }

  // Efeito para busca com debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      buscarVitrine(busca, categoriaSelecionada, subcategoriaSelecionada);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [busca, categoriaSelecionada, subcategoriaSelecionada]);

  async function verificarLogin() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) setUsuario(JSON.parse(userJson));
    } catch (e) {
      console.log(e);
    }
  }

  async function fazerLogout() {
    await AsyncStorage.clear();
    setUsuario(null);
  }

  return (
  <View style={styles.container}>
    <FlatList
      data={produtos}
      keyExtractor={(item) => item.id || item._id!}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}

      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={3}
      removeClippedSubviews={true}

      getItemLayout={(_, index) => ({
        length: 120,
        offset: 120 * index,
        index,
      })}

      // 🔥 HEADER
      ListHeaderComponent={
        <View style={styles.webWrapper}>
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.grandeTitulo}>Prajá</Text>

              <View style={styles.headerRight}>
                {usuario ? (
                  <View style={styles.usuarioLogado}>
                    <View>
                      <Text style={styles.saudacao}>
                        Olá, {usuario.email?.split("@")[0]}
                      </Text>
                      <Text style={styles.tipoUsuario}>{usuario.tipo}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={fazerLogout}
                      style={styles.logoutBtn}
                    >
                      <Feather name="log-out" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Link href="/Login" asChild>
                    <TouchableOpacity style={styles.loginBtn}>
                      <Text style={styles.linkTexto}>Entrar</Text>
                      <Feather name="user" size={24} color="#fff" />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </View>

            <Text style={styles.subtituloHeader}>
              O que você quer comprar hoje?
            </Text>

            {/* Busca */}
            <View style={styles.inputContainer}>
              <Feather name="search" size={20} color="#fff" />
              <TextInput
                placeholder="Buscar..."
                placeholderTextColor="#eee"
                style={styles.input}
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            {/* Categorias */}
            <Text style={styles.tituloSecao}>Categorias</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {categorias.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    categoriaSelecionada === item.nome && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    const nova =
                      categoriaSelecionada === item.nome
                        ? "Todos"
                        : (item.nome as Categoria);

                    setCategoriaSelecionada(nova);
                    setSubcategoriaSelecionada("");
                  }}
                >
                  <Image source={{ uri: item.imagem }} style={styles.img} />
                  <Text style={styles.nomeCategoria}>{item.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Subcategorias */}
            {categoriaSelecionada !== "Todos" && (
              <>
                <Text style={styles.tituloSecao}>Subcategorias</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {CATEGORIAS[categoriaSelecionada].map((sub) => (
                    <TouchableOpacity
                      key={sub.nome}
                      style={[
                        styles.card,
                        subcategoriaSelecionada === sub.nome && {
                          opacity: 0.7,
                        },
                      ]}
                      onPress={() =>
                        setSubcategoriaSelecionada(
                          subcategoriaSelecionada === sub.nome ? "" : sub.nome
                        )
                      }
                    >
                      <Image source={{ uri: sub.imagem }} style={styles.img} />
                      <Text style={styles.nomeCategoria}>{sub.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.tituloSecao}>Destaques</Text>
          </>
        </View>
      }

      // 🔥 PRODUTOS
      renderItem={({ item }) => (
        <View style={styles.webWrapper}>
          <TouchableOpacity style={styles.produtoCard}>
            <Image
              source={{
                uri: item.imagem || "https://via.placeholder.com/100",
              }}
              style={styles.produtoImg}
            />

            <View style={styles.produtoInfo}>
              <Text style={styles.produtoNome}>{item.nome}</Text>

              <Text style={styles.produtoDesc}>
                {item.descricao || "Sem descrição"}
              </Text>

              <Text style={styles.produtoPreco}>
                R$ {item.preco.toFixed(2).replace(".", ",")}
              </Text>
            </View>

            {/* BOTÃO + */}
            <View style={styles.btnAdd}>
              <Feather name="plus" size={18} color="#ee3f0aff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      ListEmptyComponent={
        !loading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#fff" }}>
            Nenhum produto encontrado
          </Text>
        ) : null
      }

      ListFooterComponent={
        loading ? <ActivityIndicator style={{ margin: 20 }} /> : null
      }
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ee3f0aff",
    paddingTop: Platform.OS === "web" ? 20 : 50,
  },
  webWrapper: { width: "100%", maxWidth: 800, alignSelf: "center" },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: { flexDirection: "row", alignItems: "center" },
  usuarioLogado: { flexDirection: "row", alignItems: "center", gap: 15 },
  saudacao: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  tipoUsuario: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    textAlign: "right",
    textTransform: "capitalize",
  },
  logoutBtn: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 8,
    borderRadius: 20,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  linkTexto: { color: "#faf8f6ff", fontWeight: "bold", fontSize: 14 },
  grandeTitulo: { fontSize: 28, fontWeight: "800", color: "#fff" },
  subtituloHeader: {
    fontSize: 16,
    color: "#eee",
    marginLeft: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 16 },
  tituloSecao: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 20,
    marginBottom: 15,
  },
  categoriesWrapper: { marginBottom: 30 },
  card: { alignItems: "center", marginRight: 15 },
  img: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 8,
    backgroundColor: "#ccc",
  },
  nomeCategoria: { color: "#fff", fontSize: 12, fontWeight: "600" },
  listaProdutos: { paddingHorizontal: 20, paddingBottom: 20 },
  produtoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Padrão CSS para Web
      },
      default: {
        elevation: 3, // Para Android
        shadowColor: "#000", // Para iOS
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  produtoImg: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 15,
  },
  produtoInfo: { flex: 1, justifyContent: "center" },
  produtoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  lojaTag: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  lojaNome: { fontSize: 12, color: "#666", marginLeft: 4 },
  produtoDesc: { fontSize: 12, color: "#999", marginBottom: 8, lineHeight: 16 },
  produtoPreco: { fontSize: 16, fontWeight: "bold", color: "#ee3f0aff" },
  btnAdd: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(238, 63, 10, 0.1)",
    marginLeft: 5,
  },
});
