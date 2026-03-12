/**
 * confirmar-entrega.tsx
 *
 * Tela usada pelo entregador para inserir o código de 6 dígitos
 * recebido do cliente e confirmar a entrega.
 * Após confirmação, os valores são liberados para vendedor e entregador.
 */

import React, { useState, useRef } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

export default function ConfirmarEntregaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pedidoId = params.pedidoId as string;
  const nomeCliente = params.nomeCliente as string;
  const enderecoEntrega = params.enderecoEntrega as string;
  const valorTotal = params.valorTotal as string;
  const metodoPagamento = params.metodoPagamento as string;

  const [digitos, setDigitos] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [transacoes, setTransacoes] = useState<any[]>([]);

  const inputs = useRef<(TextInput | null)[]>([]);

  function handleDigito(valor: string, index: number) {
    if (!/^\d?$/.test(valor)) return;

    const novosDigitos = [...digitos];
    novosDigitos[index] = valor;
    setDigitos(novosDigitos);

    // Avança para o próximo campo automaticamente
    if (valor && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleBackspace(index: number) {
    if (!digitos[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function confirmarEntrega() {
    const codigo = digitos.join("");
    if (codigo.length !== 6) {
      Alert.alert("Atenção", "Digite o código completo de 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) {
        router.replace("/Login");
        return;
      }
      const user = JSON.parse(userJson);

      const response = await fetch(`${API_URL}/pagamentos/confirmar-entrega`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          entregadorId: user.id,
          codigo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes("inválido")) {
          Alert.alert(
            "Código Incorreto",
            "O código informado não está correto. Verifique com o cliente e tente novamente."
          );
          setDigitos(["", "", "", "", "", ""]);
          inputs.current[0]?.focus();
        } else {
          Alert.alert("Erro", data.error || "Erro ao confirmar entrega.");
        }
        return;
      }

      setTransacoes(data.transacoes || []);
      setConfirmado(true);
    } catch (error) {
      console.error("Erro ao confirmar entrega:", error);
      Alert.alert("Erro de Conexão", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
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

  // ── TELA DE SUCESSO ───────────────────────────────────────────────────────
  if (confirmado) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.webWrapper}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={72} color="#2ecc71" />
              </View>
              <Text style={styles.successTitle}>Entrega Confirmada!</Text>
              <Text style={styles.successSubtitle}>
                Os valores foram liberados com sucesso.
              </Text>

              {transacoes.length > 0 && (
                <View style={styles.transacoesCard}>
                  <Text style={styles.transacoesTitle}>Valores Liberados</Text>
                  {transacoes.map((t, index) => (
                    <View key={index} style={styles.transacaoItem}>
                      <View style={styles.transacaoIconBg}>
                        <Feather
                          name={t.tipo === "produto" ? "shopping-bag" : "truck"}
                          size={18}
                          color={t.tipo === "produto" ? "#3498db" : "#2ecc71"}
                        />
                      </View>
                      <View style={styles.transacaoInfo}>
                        <Text style={styles.transacaoTipo}>
                          {t.tipo === "produto"
                            ? "Valor do Produto (Vendedor)"
                            : "Taxa de Entrega (Entregador)"}
                        </Text>
                        <Text style={styles.transacaoStatus}>
                          {t.status === "liberado" ? "Liberado" : t.status}
                        </Text>
                      </View>
                      <Text style={styles.transacaoValor}>
                        R$ {t.valor?.toFixed(2).replace(".", ",")}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.btnVoltar}
                onPress={() => router.replace("/tabs/pedidos")}
              >
                <Feather name="list" size={20} color="#fff" />
                <Text style={styles.btnVoltarText}>Ver Meus Pedidos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── TELA DE INSERÇÃO DO CÓDIGO ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.webWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirmar Entrega</Text>
          </View>

          {/* Dados do pedido */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalhes do Pedido</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Cliente:</Text>
              <Text style={styles.value}>{nomeCliente || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Endereço:</Text>
              <Text style={[styles.value, { flex: 1, textAlign: "right" }]}>
                {enderecoEntrega || "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pagamento:</Text>
              <Text style={styles.value}>{formatarMetodo(metodoPagamento)}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Total:</Text>
              <Text style={styles.totalValue}>
                R$ {parseFloat(valorTotal || "0").toFixed(2).replace(".", ",")}
              </Text>
            </View>
          </View>

          {/* Instrução */}
          <View style={styles.instrucaoCard}>
            <Feather name="smartphone" size={24} color="#ee3f0a" />
            <View style={styles.instrucaoTexto}>
              <Text style={styles.instrucaoTitulo}>
                Solicite o Código ao Cliente
              </Text>
              <Text style={styles.instrucaoDescricao}>
                Peça ao cliente que mostre o código de 6 dígitos que recebeu ao
                confirmar o pedido. Digite o código abaixo para confirmar a
                entrega e liberar os pagamentos.
              </Text>
            </View>
          </View>

          {/* Input do código */}
          <View style={styles.card}>
            <Text style={styles.codigoLabel}>Código de Confirmação</Text>
            <View style={styles.codigoInputContainer}>
              {digitos.map((digito, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[
                    styles.digitoInput,
                    digito ? styles.digitoInputPreenchido : null,
                  ]}
                  value={digito}
                  onChangeText={(valor) => handleDigito(valor, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace") {
                      handleBackspace(index);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.btnConfirmar,
                (digitos.join("").length !== 6 || loading) && styles.btnDesabilitado,
              ]}
              onPress={confirmarEntrega}
              disabled={digitos.join("").length !== 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#fff" />
                  <Text style={styles.btnConfirmarText}>Confirmar Entrega</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Aviso */}
          <View style={styles.avisoCard}>
            <Feather name="alert-circle" size={16} color="#f39c12" />
            <Text style={styles.avisoText}>
              Ao confirmar a entrega, os valores serão liberados automaticamente
              para o vendedor e para você (taxa de entrega). Esta ação não pode
              ser desfeita.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  webWrapper: { width: "100%", maxWidth: 600, alignSelf: "center" },
  header: {
    backgroundColor: "#ee3f0a",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
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
    ...Platform.select({ web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" } }),
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 14, color: "#333", fontWeight: "500" },
  totalValue: { fontSize: 16, fontWeight: "bold", color: "#ee3f0a" },
  instrucaoCard: {
    flexDirection: "row",
    backgroundColor: "#fff8f6",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    marginBottom: 0,
    borderLeftWidth: 3,
    borderLeftColor: "#ee3f0a",
    gap: 12,
    alignItems: "flex-start",
  },
  instrucaoTexto: { flex: 1 },
  instrucaoTitulo: { fontSize: 15, fontWeight: "bold", color: "#333", marginBottom: 6 },
  instrucaoDescricao: { fontSize: 13, color: "#555", lineHeight: 20 },
  codigoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  codigoInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  digitoInput: {
    width: 46,
    height: 58,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#fafafa",
    textAlign: "center",
  },
  digitoInputPreenchido: {
    borderColor: "#ee3f0a",
    backgroundColor: "rgba(238,63,10,0.05)",
    color: "#ee3f0a",
  },
  btnConfirmar: {
    backgroundColor: "#ee3f0a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 10,
  },
  btnDesabilitado: { opacity: 0.5 },
  btnConfirmarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  avisoCard: {
    flexDirection: "row",
    backgroundColor: "#fffbf0",
    borderRadius: 10,
    padding: 14,
    margin: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#f39c12",
    gap: 10,
  },
  avisoText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 20 },
  // Tela de sucesso
  successContainer: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  successIcon: { marginBottom: 20 },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  transacoesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  transacoesTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  transacaoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  transacaoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  transacaoInfo: { flex: 1 },
  transacaoTipo: { fontSize: 13, fontWeight: "600", color: "#333" },
  transacaoStatus: { fontSize: 11, color: "#2ecc71", marginTop: 2 },
  transacaoValor: { fontSize: 15, fontWeight: "bold", color: "#333" },
  btnVoltar: {
    backgroundColor: "#ee3f0a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
  },
  btnVoltarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
