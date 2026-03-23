/**
 * pagamento.tsx (CORRIGIDO)
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard"; // ✅ CORRETO

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

type MetodoPagamento =
  | "pix"
  | "cartao_debito"
  | "cartao_credito"
  | "especie";

type ResultadoPagamento = {
  id: string;
  metodo: MetodoPagamento;
  status: string;
  valorTotal: number;
  valorProdutos: number;
  valorTaxaEntrega: number;
  nomeCliente: string;
  enderecoCliente: string;
  codigoConfirmacao: string;
  chavePix?: string;
  tipoChavePix?: string;
  nomeLoja?: string;
};

const METODOS = [
  {
    id: "pix" as MetodoPagamento,
    label: "Pix",
    icon: "zap",
    descricao: "Pagamento instantâneo via Pix",
    cor: "#32BCAD",
  },
  {
    id: "cartao_debito" as MetodoPagamento,
    label: "Cartão Débito",
    icon: "credit-card",
    descricao: "Débito na hora",
    cor: "#3498db",
  },
  {
    id: "cartao_credito" as MetodoPagamento,
    label: "Cartão Crédito",
    icon: "credit-card",
    descricao: "Parcele sua compra",
    cor: "#9b59b6",
  },
  {
    id: "especie" as MetodoPagamento,
    label: "Dinheiro",
    icon: "dollar-sign",
    descricao: "Pague em espécie na entrega",
    cor: "#2ecc71",
  },
];

export default function PagamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ✅ SEGURANÇA DOS PARAMS
  const pedidoId = Array.isArray(params.pedidoId)
    ? params.pedidoId[0]
    : params.pedidoId;

  const total = parseFloat(
    Array.isArray(params.total) ? params.total[0] : params.total || "0"
  );

  const taxaEntrega = parseFloat(
    Array.isArray(params.taxaEntrega)
      ? params.taxaEntrega[0]
      : params.taxaEntrega || "0"
  );

  const nomeLoja = Array.isArray(params.nomeLoja)
    ? params.nomeLoja[0]
    : params.nomeLoja;

  const valorProdutos = total - taxaEntrega;

  const [usuario, setUsuario] = useState<any>(null); // ✅ NOVO
  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoPagamento | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] =
    useState<ResultadoPagamento | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  async function carregarDadosUsuario() {
    const userJson = await AsyncStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      setUsuario(user); // ✅ salvar usuário
      setNome(user.nome || "");
    }
  }

  async function confirmarPagamento() {
    if (!metodoSelecionado || !nome || !endereco) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    if (!usuario?.token) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/pagamentos/selecionar-metodo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`, // ✅ TOKEN
          },
          body: JSON.stringify({
            pedidoId,
            metodo: metodoSelecionado,
            nomeCliente: nome,
            enderecoCliente: endereco,
            taxaEntrega,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Erro", data.error || "Erro no pagamento");
        return;
      }

      setResultado(data.pagamento);
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha no pagamento");
    } finally {
      setLoading(false);
    }
  }

  async function copiarChavePix(chave: string) {
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(chave);
    } else {
      await Clipboard.setStringAsync(chave); // ✅ CORRETO
    }

    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // ✅ TELA DE RESULTADO
  if (resultado) {
    return (
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>Pedido Confirmado</Text>

          {resultado.metodo === "pix" && (
            <View style={styles.card}>
              <Text>Chave Pix:</Text>
              <Text selectable>{resultado.chavePix}</Text>

              <TouchableOpacity
                onPress={() =>
                  copiarChavePix(resultado.chavePix!)
                }
              >
                <Text>
                  {copiado ? "Copiado!" : "Copiar"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.codigo}>
            {resultado.codigoConfirmacao}
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.replace("/pedidos")
            }
          >
            <Text>Ver pedidos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ✅ TELA PRINCIPAL
  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Pagamento</Text>

        <View style={styles.card}>
          <Text>Total: R$ {total.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
          />

          <Text>Endereço</Text>
          <TextInput
            style={styles.input}
            value={endereco}
            onChangeText={setEndereco}
          />
        </View>

        <View style={styles.card}>
          {METODOS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMetodoSelecionado(m.id)}
            >
              <Text>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.avisoText}>
          Após confirmar você receberá um{" "}
          <Text style={styles.avisoBold}>
            código de 6 dígitos
          </Text>
        </Text>

        <TouchableOpacity
          onPress={confirmarPagamento}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text>Confirmar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: { marginBottom: 15 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  avisoText: {
    fontSize: 14,
    color: "#555",
  },
  avisoBold: {
    fontWeight: "bold",
    color: "#ee3f0a",
  },
  codigo: {
    fontSize: 30,
    textAlign: "center",
    margin: 20,
  },
});