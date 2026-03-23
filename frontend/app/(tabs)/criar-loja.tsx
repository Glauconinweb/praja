import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import { API_URL } from "../../services/useActions";

export default function CriarLoja() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [foto, setFoto] = useState("");

  const [loading, setLoading] = useState(false);



  async function handleCriarLoja() {
    if (!nome.trim()) {
      return Alert.alert("Erro", "Nome da loja é obrigatório.");
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      const response = await fetch(`${API_URL}/lojas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          descricao,
          telefone,
          endereco,
          foto,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 limpa formulário
        setNome("");
        setDescricao("");
        setTelefone("");
        setEndereco("");
        setFoto("");

        Alert.alert("Sucesso", "Loja criada com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              // 🔥 força refresh na tela anterior
              router.replace("/minha-loja");
            },
          },
        ]);
      } else {
        console.log("Erro backend:", data);
        Alert.alert("Erro", data.message || "Erro ao criar loja");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha na conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Criar Loja</Text>

          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da loja"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Descrição da loja"
              value={descricao}
              onChangeText={setDescricao}
            />

            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(99) 99999-9999"
              value={telefone}
              onChangeText={setTelefone}
            />

            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, número..."
              value={endereco}
              onChangeText={setEndereco}
            />

            <Text style={styles.label}>Foto (URL)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={foto}
              onChangeText={setFoto}
            />

            <TouchableOpacity
              style={[
                styles.button,
                (!nome.trim() || loading) && { opacity: 0.6 },
              ]}
              onPress={handleCriarLoja}
              disabled={!nome.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>CRIAR LOJA</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

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

  button: {
    backgroundColor: "#ee3f0a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});