/**
 * planos.tsx
 *
 * Tela de planos disponíveis para vendedores.
 * Exibe os planos com recursos, preços e permite assinar.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

type Plano = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoDias: number;
  maxProdutos: number;
  maxPedidosMes: number;
  taxaPlataforma: number;
  temDestaque: boolean;
  temRelatorios: boolean;
  temSuporte: boolean;
  recursos: string[];
};

type AssinaturaAtiva = {
  id: string;
  plano: string;
  status: string;
  expiraEm: string;
  valorPago: number;
};

const CORES_PLANO: Record<string, string> = {
  Gratuito: "#95a5a6",
  Básico: "#3498db",
  Pro: "#9b59b6",
  Premium: "#f39c12",
};

const ICONES_PLANO: Record<string, string> = {
  Gratuito: "gift",
  Básico: "star",
  Pro: "zap",
  Premium: "award",
};

export default function PlanosScreen() {
  const router = useRouter();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaAtiva | null>(null);
  const [planoAtualNome, setPlanoAtualNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) {
        router.replace("/Login");
        return;
      }
      const user = JSON.parse(userJson);
      setUserId(user.id);

      // Busca planos disponíveis
      const [resPlanos, resVendedor] = await Promise.all([
        fetch(`${API_URL}/planos`),
        fetch(`${API_URL}/planos/vendedor/${user.id}`),
      ]);

      if (resPlanos.ok) {
        const data = await resPlanos.json();
        setPlanos(data.planos || []);
      }

      if (resVendedor.ok) {
        const data = await resVendedor.json();
        setAssinaturaAtiva(data.assinaturaAtiva);
        setPlanoAtualNome(data.planoAtual?.nome || null);
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function assinarPlano(planoId: string, nomePlano: string, preco: number) {
    if (nomePlano === planoAtualNome) {
      Alert.alert("Atenção", "Você já possui este plano ativo.");
      return;
    }

    const mensagem =
      preco === 0
        ? `Deseja ativar o plano ${nomePlano} gratuitamente?`
        : `Deseja assinar o plano ${nomePlano} por R$ ${preco.toFixed(2).replace(".", ",")}/mês?\n\nO pagamento será processado via API de pagamentos.`;

    Alert.alert("Confirmar Assinatura", mensagem, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          setAssinando(planoId);
          try {
            const response = await fetch(`${API_URL}/planos/assinar`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vendedorId: userId, planoId }),
            });

            const data = await response.json();

            if (!response.ok) {
              Alert.alert("Erro", data.error || "Erro ao assinar plano.");
              return;
            }

            Alert.alert(
              "Plano Ativado!",
              `Plano ${nomePlano} ativado com sucesso!`,
              [{ text: "OK", onPress: () => carregarDados() }]
            );
          } catch (error) {
            Alert.alert("Erro de Conexão", "Verifique sua conexão.");
          } finally {
            setAssinando(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ee3f0a" />
        <Text style={styles.loadingText}>Carregando planos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.webWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Planos para Vendedores</Text>
              <Text style={styles.headerSubtitle}>
                Escolha o plano ideal para o seu negócio
              </Text>
            </View>
          </View>

          {/* Plano atual */}
          {assinaturaAtiva && (
            <View style={styles.planoAtualCard}>
              <View style={styles.planoAtualHeader}>
                <Feather name="check-circle" size={20} color="#2ecc71" />
                <Text style={styles.planoAtualTitle}>Plano Atual</Text>
              </View>
              <Text style={styles.planoAtualNome}>{assinaturaAtiva.plano}</Text>
              <Text style={styles.planoAtualExpira}>
                Válido até:{" "}
                {new Date(assinaturaAtiva.expiraEm).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          )}

          {/* Lista de planos */}
          {planos.map((plano) => {
            const cor = CORES_PLANO[plano.nome] || "#ee3f0a";
            const icone = ICONES_PLANO[plano.nome] || "star";
            const isAtual = plano.nome === planoAtualNome;
            const isPopular = plano.nome === "Pro";

            return (
              <View
                key={plano.id || plano.nome}
                style={[
                  styles.planoCard,
                  isAtual && { borderColor: cor, borderWidth: 2 },
                  isPopular && styles.planoCardPopular,
                ]}
              >
                {isPopular && (
                  <View style={[styles.badgePopular, { backgroundColor: cor }]}>
                    <Text style={styles.badgePopularText}>MAIS POPULAR</Text>
                  </View>
                )}
                {isAtual && (
                  <View style={[styles.badgeAtual, { backgroundColor: cor }]}>
                    <Text style={styles.badgeAtualText}>PLANO ATUAL</Text>
                  </View>
                )}

                {/* Cabeçalho do plano */}
                <View style={styles.planoHeader}>
                  <View style={[styles.planoIconBg, { backgroundColor: `${cor}20` }]}>
                    <Feather name={icone as any} size={28} color={cor} />
                  </View>
                  <View style={styles.planoHeaderInfo}>
                    <Text style={styles.planoNome}>{plano.nome}</Text>
                    <Text style={styles.planoDescricao}>{plano.descricao}</Text>
                  </View>
                </View>

                {/* Preço */}
                <View style={styles.precoContainer}>
                  {plano.preco === 0 ? (
                    <Text style={[styles.precoGratis, { color: cor }]}>
                      Gratuito
                    </Text>
                  ) : (
                    <View style={styles.precoRow}>
                      <Text style={styles.precoCifrao}>R$</Text>
                      <Text style={[styles.precoValor, { color: cor }]}>
                        {plano.preco.toFixed(2).replace(".", ",")}
                      </Text>
                      <Text style={styles.precoPeriodo}>/mês</Text>
                    </View>
                  )}
                </View>

                {/* Limites */}
                <View style={styles.limitesContainer}>
                  <View style={styles.limiteItem}>
                    <Feather name="package" size={14} color={cor} />
                    <Text style={styles.limiteText}>
                      {plano.maxProdutos >= 9999
                        ? "Produtos ilimitados"
                        : `Até ${plano.maxProdutos} produtos`}
                    </Text>
                  </View>
                  <View style={styles.limiteItem}>
                    <Feather name="shopping-bag" size={14} color={cor} />
                    <Text style={styles.limiteText}>
                      {plano.maxPedidosMes >= 9999
                        ? "Pedidos ilimitados"
                        : `Até ${plano.maxPedidosMes} pedidos/mês`}
                    </Text>
                  </View>
                  <View style={styles.limiteItem}>
                    <Feather name="percent" size={14} color={cor} />
                    <Text style={styles.limiteText}>
                      {plano.taxaPlataforma === 0
                        ? "Zero taxa da plataforma"
                        : `Taxa da plataforma: ${plano.taxaPlataforma}%`}
                    </Text>
                  </View>
                </View>

                {/* Recursos */}
                <View style={styles.recursosContainer}>
                  {plano.recursos.map((recurso, index) => (
                    <View key={index} style={styles.recursoItem}>
                      <Feather name="check" size={14} color={cor} />
                      <Text style={styles.recursoText}>{recurso}</Text>
                    </View>
                  ))}
                </View>

                {/* Botão */}
                <TouchableOpacity
                  style={[
                    styles.btnAssinar,
                    { backgroundColor: isAtual ? "#ccc" : cor },
                  ]}
                  onPress={() =>
                    assinarPlano(plano.id || plano.nome, plano.nome, plano.preco)
                  }
                  disabled={isAtual || assinando === (plano.id || plano.nome)}
                >
                  {assinando === (plano.id || plano.nome) ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnAssinarText}>
                      {isAtual ? "Plano Atual" : plano.preco === 0 ? "Ativar Grátis" : "Assinar Agora"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Nota sobre pagamento */}
          <View style={styles.notaCard}>
            <Feather name="info" size={16} color="#666" />
            <Text style={styles.notaText}>
              O pagamento dos planos pagos é processado via API de pagamentos integrada.
              Você pode cancelar sua assinatura a qualquer momento.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  webWrapper: { width: "100%", maxWidth: 600, alignSelf: "center" },
  header: {
    backgroundColor: "#ee3f0a",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  planoAtualCard: {
    backgroundColor: "#f0fff4",
    borderRadius: 12,
    padding: 14,
    margin: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  planoAtualHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  planoAtualTitle: { fontSize: 13, color: "#2ecc71", fontWeight: "bold" },
  planoAtualNome: { fontSize: 18, fontWeight: "bold", color: "#333" },
  planoAtualExpira: { fontSize: 12, color: "#666", marginTop: 2 },
  planoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 12,
    marginBottom: 0,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    ...Platform.select({ web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.1)" } }),
    position: "relative",
    overflow: "hidden",
  },
  planoCardPopular: {
    elevation: 6,
    ...Platform.select({ web: { boxShadow: "0px 6px 20px rgba(0,0,0,0.15)" } }),
  },
  badgePopular: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  badgePopularText: { color: "#fff", fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  badgeAtual: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomRightRadius: 10,
  },
  badgeAtualText: { color: "#fff", fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  planoHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  planoIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  planoHeaderInfo: { flex: 1 },
  planoNome: { fontSize: 20, fontWeight: "bold", color: "#333" },
  planoDescricao: { fontSize: 13, color: "#666", marginTop: 2 },
  precoContainer: { marginBottom: 16 },
  precoGratis: { fontSize: 28, fontWeight: "bold" },
  precoRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  precoCifrao: { fontSize: 16, color: "#666", marginBottom: 4 },
  precoValor: { fontSize: 36, fontWeight: "bold", lineHeight: 40 },
  precoPeriodo: { fontSize: 14, color: "#999", marginBottom: 6 },
  limitesContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  limiteItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  limiteText: { fontSize: 13, color: "#555" },
  recursosContainer: { marginBottom: 16, gap: 6 },
  recursoItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  recursoText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 18 },
  btnAssinar: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAssinarText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  notaCard: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 14,
    margin: 12,
    gap: 10,
  },
  notaText: { flex: 1, fontSize: 12, color: "#666", lineHeight: 18 },
});
