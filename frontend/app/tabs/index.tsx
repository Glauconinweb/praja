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

const categorias = [
  {
    id: "1",
    nome: "Doces",
    imagem:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "2",
    nome: "Bolos",
    imagem:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "3",
    nome: "Salgados",
    imagem:
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "4",
    nome: "Lanches",
    imagem:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "5",
    nome: "Bebidas",
    imagem:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "6",
    nome: "Mercado",
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");

  useFocusEffect(
    useCallback(() => {
      verificarLogin();
    }, []),
  );

  useEffect(() => {
    buscarVitrine();
  }, []);

  async function buscarVitrine(termo = "", cat = "Todos") {
    try {
      setLoading(true);
      // Usando a constante API_URL que definimos acima
      let url = `${API_URL}/busca`;
      const params = [];
      if (termo) params.push(`q=${encodeURIComponent(termo)}`);
      if (cat && cat !== "Todos")
        params.push(`categoria=${encodeURIComponent(cat)}`);

      if (params.length > 0) {
        url += "?" + params.join("&");
      } else {
        url = `${API_URL}/produtos/vitrine`;
      }

      const response = await fetch(url);
      const data = await response.json();
      console.log("O que veio da API:", data);
      setProdutos(Array.isArray(data) ? data : []); // Garante que produtos seja sempre um array
    } catch (error) {
      console.log("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Efeito para busca com debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      buscarVitrine(busca, categoriaSelecionada);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [busca, categoriaSelecionada]);

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
            O que você quer comer hoje?
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
                  onPress={() =>
                    setCategoriaSelecionada(
                      categoriaSelecionada === item.nome ? "Todos" : item.nome,
                    )
                  }
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
              produtos.map((item: any) => (
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
