import React, { useState, useCallback, useEffect } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      imagem: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=150",
    },
    {
      nome: "salgados",
      imagem: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=150",
    },
    {
      nome: "bebidas",
      imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=150",
    },
  ],
  roupas: [
    {
      nome: "camisa",
      imagem: "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=150",
    },
    {
      nome: "calção",
      imagem: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=150",
    },
    {
      nome: "cueca",
      imagem: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=150",
    },
    {
      nome: "calcinha",
      imagem: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=150",
    },
  ],
} as const;

type Categoria = keyof typeof CATEGORIAS;
type SubcategoriaNome =
  | "doces"
  | "salgados"
  | "bebidas"
  | "camisa"
  | "calção"
  | "cueca"
  | "calcinha";

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | "Todos">("Todos");
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<SubcategoriaNome | "">("");

  const categorias = Object.keys(CATEGORIAS).map((cat, index) => ({
    id: String(index),
    nome: cat,
    imagem:
      cat === "lanches"
        ? "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=150"
        : "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=150",
  }));

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <View style={styles.webWrapper}>
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
                    <Feather name="user" size={24} color="#f6f8faff" />
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
            <Feather
              style={styles.icon}
              name="search"
              size={20}
              color="#f6f8faff"
            />
            <TextInput
              placeholder="Buscar comida, mercado..."
              placeholderTextColor="#eee"
              style={styles.input}
              value={busca}
              onChangeText={setBusca}
            />
          </View>

          {/* Categorias */}
          <Text style={styles.tituloSecao}>Categorias</Text>
          <View style={styles.categoriesWrapper}>
            <FlatList
              data={categorias}
              horizontal
              showsHorizontalScrollIndicator={Platform.OS === "web"}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.card,
                    categoriaSelecionada === item.nome && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    const novaCategoria =
                      categoriaSelecionada === item.nome ? "Todos" : (item.nome as Categoria);

                    setCategoriaSelecionada(novaCategoria);
                    setSubcategoriaSelecionada(""); // limpa subcategoria
                  }}
                >
                  <Image
                    source={{ uri: item.imagem }}
                    style={[
                      styles.img,
                      categoriaSelecionada === item.nome && {
                        borderColor: "#fff",
                        borderWidth: 3,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.nomeCategoria,
                      categoriaSelecionada === item.nome && {
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {categoriaSelecionada !== "Todos" && (
            <>
              <Text style={styles.tituloSecao}>Subcategorias</Text>

              <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 20 }}>
                {CATEGORIAS[categoriaSelecionada as keyof typeof CATEGORIAS].map(
                  (sub) => (
                  <TouchableOpacity
                    key={sub.nome}
                    style={[
                      styles.card,
                      subcategoriaSelecionada === sub.nome && { opacity: 0.7 },
                    ]}
                    onPress={() =>
                      setSubcategoriaSelecionada(
                        subcategoriaSelecionada === sub.nome ? "" : sub.nome
                      )
                    }
                  >

                    <Image
                      source={{ uri: sub.imagem }}
                      style={[
                        styles.img,
                        subcategoriaSelecionada === sub.nome && {
                          borderColor: "#fff",
                          borderWidth: 3,
                        },
                      ]}
                    />
                    

                    <Text style={styles.nomeCategoria}>{sub.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Lista de Produtos */}
          <Text style={styles.tituloSecao}>Destaques da Região</Text>
          <View style={styles.listaProdutos}>
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : produtos.length === 0 ? (
              <Text
                style={{ color: "#fff", textAlign: "center", marginTop: 20 }}
              >
                Nenhum produto disponível.
              </Text>
            ) : (
              produtos.map((item: Produto) => (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={styles.produtoCard}
                >
                  <Image
                    source={{
                      uri: item.imagem || "https://via.placeholder.com/150",
                    }}
                    style={styles.produtoImg}
                  />
                  <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <View style={styles.lojaTag}>
                      <Feather name="shopping-bag" size={12} color="#666" />
                      <Text style={styles.lojaNome}>
                        {item.vendedor?.nome || "Loja Parceira"}
                      </Text>
                    </View>
                    <Text style={styles.produtoDesc} numberOfLines={2}>
                      {item.descricao || "Sem descrição."}
                    </Text>
                    <Text style={styles.produtoPreco}>
                      R$ {item.preco?.toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <View style={styles.btnAdd}>
                    <Feather name="plus" size={18} color="#ee3f0aff" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Os estilos (StyleSheet) permanecem os mesmos que você já tem
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
