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
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. Define o tipo para parar o erro "property does not exist on type never"
type UsuarioData = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  token: string;
};

export default function AdicionarProduto() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 2. Aplica a tipagem aqui
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);

  // Formulário
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagem, setImagem] = useState("");

  useEffect(() => {
    async function getUser() {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const parsedUser = JSON.parse(userJson);
        setUsuario(parsedUser);
        console.log("Usuário carregado:", parsedUser); // Debug para ver se o ID está vindo
      }
    }
    getUser();
  }, []);

  async function handleCadastro() {
    if (!nome || !preco || !quantidade)
      return Alert.alert("Erro", "Preencha os campos obrigatórios.");

    // --- ÁREA DE AJUSTE RÁPIDO (BYPASS) ---
    // Se o login não salvou o ID, cole um ID válido do seu MongoDB aqui entre as aspas para testar
    const ID_FIXO_PARA_TESTE = "";

    // Tenta pegar do usuário logado, se não tiver, usa o fixo
    const vendedorIdFinal = usuario?.id || ID_FIXO_PARA_TESTE;

    if (!vendedorIdFinal) {
      return Alert.alert(
        "Erro Crítico",
        "Não foi possível identificar o vendedor. Faça login novamente ou cole um ID no código."
      );
    }
    // --------------------------------------

    setLoading(true);
    try {
      // Confirme se este IP é o do seu PC atual (ipconfig)
      const backendUrl = "http://:5001/api/produtos/criar";

      const bodyData = {
        nome,
        preco,
        quantidade,
        descricao,
        categoria,
        imagem,
        vendedorId: vendedorIdFinal, // Agora enviamos o ID obrigatório
      };

      console.log("Enviando:", bodyData); // Debug

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Produto cadastrado!");
        router.back();
      } else {
        Alert.alert("Erro", data.message || "Falha no backend");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha na conexão. Verifique o IP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Produto</Text>
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
            style={styles.btnCadastrar}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  header: {
    backgroundColor: "#ee3f0aff",
    padding: 20,
    paddingTop: 50,
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
  btnCadastrar: {
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
