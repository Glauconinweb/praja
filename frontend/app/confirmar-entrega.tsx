/**
 * confirmar-entrega.tsx (CORRIGIDO)
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

export default function ConfirmarEntregaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ✅ PROTEÇÃO DE PARAMS
  const pedidoId = Array.isArray(params.pedidoId)
    ? params.pedidoId[0]
    : params.pedidoId;

  const nomeCliente = Array.isArray(params.nomeCliente)
    ? params.nomeCliente[0]
    : params.nomeCliente;

  const enderecoEntrega = Array.isArray(params.enderecoEntrega)
    ? params.enderecoEntrega[0]
    : params.enderecoEntrega;

  const valorTotal = Array.isArray(params.valorTotal)
    ? params.valorTotal[0]
    : params.valorTotal;

  const metodoPagamento = Array.isArray(params.metodoPagamento)
    ? params.metodoPagamento[0]
    : params.metodoPagamento;

  const [usuario, setUsuario] = useState<any>(null);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const userJson = await AsyncStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      setUsuario(user);
    }
  }

  async function confirmarEntrega() {
    if (!codigo || codigo.length !== 6) {
      Alert.alert("Erro", "Digite o código de 6 dígitos.");
      return;
    }

    if (!usuario?.token) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/pedidos/confirmar-entrega`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`, // ✅ TOKEN
          },
          body: JSON.stringify({
            pedidoId,
            codigoConfirmacao: codigo,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Erro", data.error || "Código inválido");
        return;
      }

      Alert.alert("Sucesso", "Entrega confirmada!");

      router.replace("/pedidos");
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao confirmar entrega");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar Entrega</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Cliente:</Text>
        <Text>{nomeCliente}</Text>

        <Text style={styles.label}>Endereço:</Text>
        <Text>{enderecoEntrega}</Text>

        <Text style={styles.label}>Valor:</Text>
        <Text>R$ {valorTotal}</Text>

        <Text style={styles.label}>Pagamento:</Text>
        <Text>{metodoPagamento}</Text>
      </View>

      <Text style={styles.label}>Código de confirmação</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite os 6 dígitos"
        keyboardType="numeric"
        maxLength={6}
        value={codigo}
        onChangeText={setCodigo}
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={confirmarEntrega}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoTexto}>
            Confirmar Entrega
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 6,
  },
  label: {
    fontWeight: "bold",
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    marginTop: 10,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 5,
  },
  botao: {
    backgroundColor: "#2ecc71",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});