import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../services/useActions";

export default function EditarProduto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const produtoId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");

  const [imagem, setImagem] = useState("");

  // 🔥 CATEGORIAS TIPADAS
  const CATEGORIAS = {
    lanches: ["doces", "salgados", "bebidas"],
    roupas: ["camisa", "calção", "cueca", "calcinha"],
  };

  type CategoriaTipo = keyof typeof CATEGORIAS;

  const [categoria, setCategoria] = useState<CategoriaTipo | "">("");
  const [subcategoria, setSubcategoria] = useState<SubcategoriaTipo | "">("");

  type SubcategoriaTipo = (typeof CATEGORIAS)[CategoriaTipo][number];
  

  useEffect(() => {
    async function buscarProduto() {
      if (!produtoId) return;

      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/produtos/${produtoId}`
        );

        const data = await response.json();

        if (response.ok) {
          setNome(data.nome || "");
          setPreco(data.preco?.toString() || "");
          setQuantidade(data.quantidade?.toString() || "");
          setDescricao(data.descricao || "");
          setImagem(data.imagem || "");

          // ✅ VALIDA CATEGORIA
          if (data.categoria && data.categoria in CATEGORIAS) {
            const cat = data.categoria as CategoriaTipo;
            setCategoria(cat);

            // ✅ VALIDA SUBCATEGORIA
            if (
              data.subcategoria &&
              CATEGORIAS[cat].includes(data.subcategoria as SubcategoriaTipo)
            ) {
              setSubcategoria(data.subcategoria);
            } else {
              setSubcategoria("");
            }
          } else {
            setCategoria("");
            setSubcategoria("");
          }
        } else {
          Alert.alert("Erro", data.message || "Erro ao carregar produto");
          router.back();
        }
      } catch (error) {
        console.log(error);
        Alert.alert("Erro", "Falha na conexão");
      } finally {
        setLoading(false);
      }
    }

    buscarProduto();
  }, [produtoId]);

  async function handleSalvar() {
    if (!nome || !preco || !quantidade) {
      return Alert.alert("Erro", "Preencha os campos obrigatórios.");
    }

    if (!categoria || !subcategoria) {
      return Alert.alert("Erro", "Selecione categoria e subcategoria.");
    }

    const precoNumber = parseFloat(preco);
    if (isNaN(precoNumber) || precoNumber <= 0) {
      return Alert.alert("Erro", "Preço inválido.");
    }

    const qtdNumber = parseInt(quantidade);
    if (isNaN(qtdNumber) || qtdNumber < 0) {
      return Alert.alert("Erro", "Quantidade inválida.");
    }

    setSalvando(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/produtos/${produtoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome,
            preco: precoNumber,
            quantidade: qtdNumber,
            descricao,
            categoria,
            subcategoria,
            imagem,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Produto atualizado!");
        router.replace("/minha-loja");
      } else {
        console.log(data);
        Alert.alert("Erro", data.message || "Erro ao atualizar");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha na conexão");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#ee3f0a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Editar Produto</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Preço *</Text>
              <TextInput
                style={styles.input}
                value={preco}
                onChangeText={setPreco}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Quantidade *</Text>
              <TextInput
                style={styles.input}
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 🔥 CATEGORIA */}
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoriasContainer}>
            {(Object.keys(CATEGORIAS) as CategoriaTipo[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoriaButton,
                  categoria === cat && styles.categoriaAtiva,
                ]}
                onPress={() => {
                  setCategoria(cat);
                  setSubcategoria(CATEGORIAS[cat][0]);
                }}
              >
                <Text
                  style={{
                    color: categoria === cat ? "#fff" : "#000",
                    fontWeight: "bold",
                  }}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🔥 SUBCATEGORIA */}
          {categoria && (
            <>
              <Text style={styles.label}>Subcategoria</Text>
              <View style={styles.categoriasContainer}>
                {CATEGORIAS[categoria].map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    style={[
                      styles.categoriaButton,
                      subcategoria === sub && styles.categoriaAtiva,
                    ]}
                    onPress={() => setSubcategoria(sub)}
                  >
                    <Text
                      style={{
                        color: subcategoria === sub ? "#fff" : "#000",
                        fontWeight: "bold",
                      }}
                    >
                      {sub.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Imagem</Text>
          <TextInput
            style={styles.input}
            value={imagem}
            onChangeText={setImagem}
          />

          {imagem ? (
            <Image
              source={{ uri: imagem }}
              style={styles.previewImg}
              onError={() => setImagem("")}
            />
          ) : null}

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.btnSalvar,
              (salvando || !nome || !preco || !quantidade) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>SALVAR</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },

  header: {
    backgroundColor: "#ee3f0a",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  content: { padding: 20 },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },

  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
  },

  btnSalvar: {
    backgroundColor: "#ee3f0a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  previewImg: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#eee",
  },

  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },

  categoriaButton: {
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  categoriaAtiva: {
    backgroundColor: "#ee3f0a",
  },
});