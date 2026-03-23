import React, { useState } from "react";
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

import { API_URL } from "../services/useActions";

// 🔥 CATEGORIAS TIPADAS
const CATEGORIAS = {
  lanches: ["doces", "salgados", "bebidas"],
  roupas: ["camisa", "calção", "cueca", "calcinha"],
} as const;

type CategoriaTipo = keyof typeof CATEGORIAS;

export default function AdicionarProduto() {
  const router = useRouter();

  const { lojaId, nome } = useLocalSearchParams();

  const lojaIdFinal = Array.isArray(lojaId) ? lojaId[0] : lojaId;
  const lojaNome = Array.isArray(nome) ? nome[0] : nome;

  const [loading, setLoading] = useState(false);

  const [nomeProduto, setNomeProduto] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaTipo | "">("");
  const [subcategoria, setSubcategoria] = useState("");
  const [imagem, setImagem] = useState("");

  function limparCampos() {
    setNomeProduto("");
    setPreco("");
    setQuantidade("");
    setDescricao("");
    setCategoria("");
    setSubcategoria("");
    setImagem("");
  }

  async function handleCadastro() {
    if (!nomeProduto || !preco || !quantidade) {
      return Alert.alert("Erro", "Preencha os campos obrigatórios.");
    }

    if (!categoria || !subcategoria) {
      return Alert.alert("Erro", "Selecione categoria e subcategoria.");
    }

    if (!lojaIdFinal) {
      return Alert.alert("Erro", "Loja não identificada.");
    }

    const precoNumber = parseFloat(preco);
    if (isNaN(precoNumber) || precoNumber <= 0) {
      return Alert.alert("Erro", "Preço inválido.");
    }

    const qtdNumber = parseInt(quantidade);
    if (isNaN(qtdNumber) || qtdNumber < 0) {
      return Alert.alert("Erro", "Quantidade inválida.");
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/produtos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nomeProduto,
            preco: precoNumber,
            quantidade: qtdNumber,
            descricao,
            categoria,
            subcategoria,
            imagem,
            lojaId: lojaIdFinal,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        limparCampos();
        Alert.alert("Sucesso", "Produto cadastrado!");
      } else {
        console.log(data);
        Alert.alert("Erro", data.message || "Erro ao cadastrar");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha na conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Novo Produto</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.lojaText}>
            Loja: {lojaNome || "Não informada"}
          </Text>

          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={nomeProduto}
            onChangeText={setNomeProduto}
          />

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
                  setSubcategoria("");
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
            style={[styles.btnCadastrar, loading && { opacity: 0.6 }]}
            onPress={handleCadastro}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>SALVAR PRODUTO</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// 🔥 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },

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

  content: {
    padding: 20,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 3,
  },

  lojaText: {
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 16,
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

  btnCadastrar: {
    backgroundColor: "#ee3f0a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
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