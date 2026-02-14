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
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function EditarProduto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Formulário
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagem, setImagem] = useState("");

  useEffect(() => {
    async function buscarProduto() {
      if (!id) return;
      
      try {
        setLoading(true);
        const baseUrl = Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://localhost:5001";
        const response = await fetch(`${baseUrl}/api/produtos/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setNome(data.nome || "");
          setPreco(data.preco ? data.preco.toString() : "");
          setQuantidade(data.quantidade ? data.quantidade.toString() : "");
          setDescricao(data.descricao || "");
          setCategoria(data.categoria || "");
          setImagem(data.imagem || "");
        } else {
          Alert.alert("Erro", data.message || "Não foi possível carregar os dados do produto.");
          router.back();
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
        Alert.alert("Erro", "Falha na conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    }
    
    buscarProduto();
  }, [id]);

  async function handleSalvar() {
    if (!nome || !preco || !quantidade) {
      return Alert.alert("Erro", "Preencha os campos obrigatórios (Nome, Preço e Estoque).");
    }

    setSalvando(true);
    try {
      const baseUrl = Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://localhost:5001";
      
      const precoFloat = parseFloat(preco.replace(",", "."));
      const quantidadeInt = parseInt(quantidade);

      if (isNaN(precoFloat)) {
        setSalvando(false);
        return Alert.alert("Erro", "O preço deve ser um número válido.");
      }

      if (isNaN(quantidadeInt)) {
        setSalvando(false);
        return Alert.alert("Erro", "A quantidade deve ser um número inteiro.");
      }

      const response = await fetch(`${baseUrl}/api/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          preco: precoFloat,
          quantidade: quantidadeInt,
          descricao,
          categoria,
          imagem,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Produto atualizado com sucesso!");
        router.back();
      } else {
        Alert.alert("Erro", data.message || "Falha ao atualizar produto.");
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      Alert.alert("Erro", "Falha na conexão. Verifique o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#ee3f0aff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Produto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Nome do Produto *</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Bolo de Pote"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Preço (R$) *</Text>
              <TextInput
                style={styles.input}
                value={preco}
                onChangeText={setPreco}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Estoque *</Text>
              <TextInput
                style={styles.input}
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            value={categoria}
            onChangeText={setCategoria}
            placeholder="Ex: Doces"
          />

          <Text style={styles.label}>URL da Imagem</Text>
          <TextInput
            style={styles.input}
            value={imagem}
            onChangeText={setImagem}
            placeholder="https://..."
          />
          {imagem ? (
            <Image source={{ uri: imagem }} style={styles.previewImg} />
          ) : null}

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
            placeholder="Detalhes do produto..."
          />

          <TouchableOpacity
            style={styles.btnSalvar}
            onPress={handleSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>SALVAR ALTERAÇÕES</Text>
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
    backgroundColor: "#ee3f0aff",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 5, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  btnSalvar: {
    backgroundColor: "#ee3f0aff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  previewImg: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#eee",
  },
});