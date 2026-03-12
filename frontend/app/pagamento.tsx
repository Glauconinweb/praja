/**
 * pagamento.tsx
 *
 * Tela de seleção de método de pagamento exibida após o cliente fazer um pedido.
 * Funcionalidades:
 *  - Seleção de método: Pix, Cartão Débito, Cartão Crédito, Espécie
 *  - Coleta de nome e endereço do cliente
 *  - Exibição da chave Pix do vendedor para o cliente copiar (se método Pix)
 *  - Exibição do código de 6 dígitos para confirmação de entrega
 *  - Resumo dos valores: produto + taxa de entrega
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
  Clipboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

type MetodoPagamento = "pix" | "cartao_debito" | "cartao_credito" | "especie";

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
  const pedidoId = params.pedidoId as string;
  const totalStr = params.total as string;
  const taxaEntregaStr = params.taxaEntrega as string;
  const nomeLoja = params.nomeLoja as string;

  const total = parseFloat(totalStr || "0");
  const taxaEntrega = parseFloat(taxaEntregaStr || "0");
  const valorProdutos = total - taxaEntrega;

  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoPagamento | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPagamento | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  async function carregarDadosUsuario() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setNome(user.nome || "");
      }
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
    }
  }

  async function confirmarPagamento() {
    if (!metodoSelecionado) {
      Alert.alert("Atenção", "Selecione um método de pagamento.");
      return;
    }
    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe seu nome completo.");
      return;
    }
    if (!endereco.trim()) {
      Alert.alert("Atenção", "Informe o endereço de entrega.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/pagamentos/selecionar-metodo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          metodo: metodoSelecionado,
          nomeCliente: nome.trim(),
          enderecoCliente: endereco.trim(),
          taxaEntrega,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data.error || "Erro ao processar pagamento.");
        return;
      }

      setResultado(data.pagamento);
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      Alert.alert("Erro de Conexão", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function copiarChavePix(chave: string) {
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(chave);
    } else {
      Clipboard.setString(chave);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
    Alert.alert("Copiado!", "Chave Pix copiada para a área de transferência.");
  }

  function formatarMetodo(metodo: string) {
    const mapa: Record<string, string> = {
      pix: "Pix",
      cartao_debito: "Cartão Débito",
      cartao_credito: "Cartão Crédito",
      especie: "Dinheiro (Espécie)",
    };
    return mapa[metodo] || metodo;
  }

  // ── TELA DE RESULTADO (após confirmar pagamento) ──────────────────────────
  if (resultado) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.webWrapper}>
            {/* Header de sucesso */}
            <View style={styles.successHeader}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={48} color="#2ecc71" />
              </View>
              <Text style={styles.successTitle}>Pedido Confirmado!</Text>
              <Text style={styles.successSubtitle}>
                Seu pedido foi registrado com sucesso.
              </Text>
            </View>

            {/* Resumo do pagamento */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumo do Pagamento</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Método:</Text>
                <Text style={styles.value}>
                  {formatarMetodo(resultado.metodo)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Produtos:</Text>
                <Text style={styles.value}>
                  R$ {resultado.valorProdutos.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Taxa de entrega:</Text>
                <Text style={styles.value}>
                  R$ {resultado.valorTaxaEntrega.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  R$ {resultado.valorTotal.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </View>

            {/* Chave Pix (apenas para método Pix) */}
            {resultado.metodo === "pix" && resultado.chavePix && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  <Feather name="zap" size={16} color="#32BCAD" /> Pagar via
                  Pix
                </Text>
                <Text style={styles.pixInstrucao}>
                  Copie a chave Pix abaixo e realize o pagamento no seu banco:
                </Text>
                <View style={styles.pixKeyContainer}>
                  <View style={styles.pixKeyInfo}>
                    <Text style={styles.pixKeyLabel}>
                      {resultado.tipoChavePix?.toUpperCase() || "CHAVE"}
                    </Text>
                    <Text style={styles.pixKeyValue} selectable>
                      {resultado.chavePix}
                    </Text>
                    <Text style={styles.pixKeyLoja}>
                      Beneficiário: {resultado.nomeLoja}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => copiarChavePix(resultado.chavePix!)}
                  >
                    <Feather
                      name={copiado ? "check" : "copy"}
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.copyBtnText}>
                      {copiado ? "Copiado!" : "Copiar"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.pixAviso}>
                  Após realizar o pagamento, aguarde a confirmação do vendedor.
                </Text>
              </View>
            )}

            {/* Instruções para cartão */}
            {(resultado.metodo === "cartao_debito" ||
              resultado.metodo === "cartao_credito") && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  <Feather name="credit-card" size={16} color="#3498db" />{" "}
                  Pagamento com Cartão
                </Text>
                <Text style={styles.instrucao}>
                  O entregador levará a maquininha para você pagar na entrega.
                  Tenha seu cartão em mãos.
                </Text>
              </View>
            )}

            {/* Instruções para espécie */}
            {resultado.metodo === "especie" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  <Feather name="dollar-sign" size={16} color="#2ecc71" />{" "}
                  Pagamento em Dinheiro
                </Text>
                <Text style={styles.instrucao}>
                  Separe o valor exato ou tenha troco disponível. O pagamento
                  será feito ao entregador na entrega.
                </Text>
                <View style={styles.valorDestaque}>
                  <Text style={styles.valorDestaqueLabel}>Valor a pagar:</Text>
                  <Text style={styles.valorDestaqueValue}>
                    R$ {resultado.valorTotal.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              </View>
            )}

            {/* Código de 6 dígitos */}
            <View style={[styles.card, styles.codigoCard]}>
              <View style={styles.codigoHeader}>
                <Feather name="shield" size={24} color="#ee3f0a" />
                <Text style={styles.codigoTitle}>
                  Código de Confirmação de Entrega
                </Text>
              </View>
              <Text style={styles.codigoInstrucao}>
                Após receber seu pedido, mostre este código ao entregador para
                confirmar a entrega e liberar o pagamento:
              </Text>
              <View style={styles.codigoContainer}>
                {resultado.codigoConfirmacao.split("").map((digit, index) => (
                  <View key={index} style={styles.codigoDigit}>
                    <Text style={styles.codigoDigitText}>{digit}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.codigoAviso}>
                Guarde este código! Ele é necessário para confirmar a entrega e
                liberar o pagamento ao vendedor e entregador.
              </Text>
            </View>

            {/* Botão voltar */}
            <TouchableOpacity
              style={styles.btnVoltar}
              onPress={() => router.replace("/tabs/pedidos")}
            >
              <Feather name="list" size={20} color="#fff" />
              <Text style={styles.btnVoltarText}>Ver Meus Pedidos</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── TELA DE SELEÇÃO DE MÉTODO ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.webWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forma de Pagamento</Text>
          </View>

          {/* Resumo do pedido */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo do Pedido</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Loja:</Text>
              <Text style={styles.value}>{nomeLoja || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Produtos:</Text>
              <Text style={styles.value}>
                R$ {valorProdutos.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Taxa de entrega:</Text>
              <Text style={styles.value}>
                R$ {taxaEntrega.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                R$ {total.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          </View>

          {/* Dados do cliente */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seus Dados</Text>
            <Text style={styles.inputLabel}>Nome completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome completo"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />
            <Text style={styles.inputLabel}>Endereço de entrega *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Rua, número, bairro, cidade"
              value={endereco}
              onChangeText={setEndereco}
              multiline
              numberOfLines={3}
              autoCapitalize="words"
            />
          </View>

          {/* Métodos de pagamento */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Escolha o Método de Pagamento</Text>
            {METODOS.map((metodo) => (
              <TouchableOpacity
                key={metodo.id}
                style={[
                  styles.metodoItem,
                  metodoSelecionado === metodo.id && {
                    borderColor: metodo.cor,
                    backgroundColor: `${metodo.cor}15`,
                  },
                ]}
                onPress={() => setMetodoSelecionado(metodo.id)}
              >
                <View
                  style={[
                    styles.metodoIconContainer,
                    { backgroundColor: `${metodo.cor}20` },
                  ]}
                >
                  <Feather
                    name={metodo.icon as any}
                    size={24}
                    color={metodo.cor}
                  />
                </View>
                <View style={styles.metodoInfo}>
                  <Text style={styles.metodoLabel}>{metodo.label}</Text>
                  <Text style={styles.metodoDescricao}>{metodo.descricao}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    metodoSelecionado === metodo.id && {
                      borderColor: metodo.cor,
                    },
                  ]}
                >
                  {metodoSelecionado === metodo.id && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: metodo.cor },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Aviso sobre código de confirmação */}
          <View style={styles.avisoCard}>
            <Feather name="info" size={18} color="#ee3f0a" />
            <Text style={styles.avisoText}>
              Após confirmar, você receberá um{" "}
              <Text style={styles.aviso bold}>código de 6 dígitos</Text> para
              mostrar ao entregador na entrega. Isso garante que o pagamento só
              seja liberado quando você receber seu pedido.
            </Text>
          </View>

          {/* Botão confirmar */}
          <TouchableOpacity
            style={[
              styles.btnConfirmar,
              (!metodoSelecionado || !nome || !endereco || loading) &&
                styles.btnDesabilitado,
            ]}
            onPress={confirmarPagamento}
            disabled={!metodoSelecionado || !nome || !endereco || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.btnConfirmarText}>
                  Confirmar Pagamento
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  webWrapper: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  header: {
    backgroundColor: "#ee3f0a",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    marginBottom: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ee3f0a",
  },
  inputLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  metodoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#eee",
    marginBottom: 10,
  },
  metodoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  metodoInfo: {
    flex: 1,
  },
  metodoLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  metodoDescricao: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  avisoCard: {
    flexDirection: "row",
    backgroundColor: "#fff8f6",
    borderRadius: 10,
    padding: 14,
    margin: 12,
    marginBottom: 0,
    borderLeftWidth: 3,
    borderLeftColor: "#ee3f0a",
    gap: 10,
  },
  avisoText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  "aviso bold": {
    fontWeight: "bold",
    color: "#ee3f0a",
  },
  btnConfirmar: {
    backgroundColor: "#ee3f0a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  btnDesabilitado: {
    opacity: 0.5,
  },
  btnConfirmarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Tela de resultado
  successHeader: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  pixInstrucao: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  pixKeyContainer: {
    backgroundColor: "#f0fdf9",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#32BCAD",
    marginBottom: 10,
  },
  pixKeyInfo: {
    marginBottom: 10,
  },
  pixKeyLabel: {
    fontSize: 11,
    color: "#32BCAD",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  pixKeyValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1,
  },
  pixKeyLoja: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  copyBtn: {
    backgroundColor: "#32BCAD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  copyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  pixAviso: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginTop: 8,
  },
  instrucao: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  valorDestaque: {
    backgroundColor: "#f0fff4",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  valorDestaqueLabel: {
    fontSize: 13,
    color: "#666",
  },
  valorDestaqueValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2ecc71",
    marginTop: 4,
  },
  codigoCard: {
    borderWidth: 2,
    borderColor: "#ee3f0a",
    backgroundColor: "#fff8f6",
  },
  codigoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  codigoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ee3f0a",
    flex: 1,
  },
  codigoInstrucao: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    marginBottom: 16,
  },
  codigoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  codigoDigit: {
    width: 44,
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ee3f0a",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#ee3f0a",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  codigoDigitText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ee3f0a",
  },
  codigoAviso: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
  btnVoltar: {
    backgroundColor: "#ee3f0a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  btnVoltarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
