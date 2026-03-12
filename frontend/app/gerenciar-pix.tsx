/**
 * gerenciar-pix.tsx
 *
 * Tela para vendedores e entregadores cadastrarem/atualizarem suas chaves Pix.
 * Permite escolher o tipo de chave e informar o valor.
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
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

type TipoChavePix = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

const TIPOS_CHAVE = [
  { id: "cpf" as TipoChavePix, label: "CPF", placeholder: "000.000.000-00", icon: "user" },
  { id: "cnpj" as TipoChavePix, label: "CNPJ", placeholder: "00.000.000/0001-00", icon: "briefcase" },
  { id: "email" as TipoChavePix, label: "E-mail", placeholder: "seu@email.com", icon: "mail" },
  { id: "telefone" as TipoChavePix, label: "Telefone", placeholder: "+55 11 99999-9999", icon: "phone" },
  { id: "aleatoria" as TipoChavePix, label: "Chave Aleatória", placeholder: "Cole a chave aleatória aqui", icon: "key" },
];

export default function GerenciarPixScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [tipoAtual, setTipoAtual] = useState<string | null>(null);
  const [chaveAtual, setChaveAtual] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoChavePix>("cpf");
  const [chave, setChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

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

      // Busca chave Pix atual
      const response = await fetch(`${API_URL}/pix/chave/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTipoAtual(data.tipoChavePix);
        setChaveAtual(data.chavePix);
        setTipoSelecionado(data.tipoChavePix as TipoChavePix);
        setChave(data.chavePix);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  }

  async function salvarChavePix() {
    if (!chave.trim()) {
      Alert.alert("Atenção", "Informe a chave Pix.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/pix/chave/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipoSelecionado, chave: chave.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data.error || "Erro ao salvar chave Pix.");
        return;
      }

      setTipoAtual(tipoSelecionado);
      setChaveAtual(chave.trim());
      Alert.alert("Sucesso!", "Chave Pix cadastrada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao salvar chave Pix:", error);
      Alert.alert("Erro de Conexão", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function removerChavePix() {
    Alert.alert(
      "Remover Chave Pix",
      "Tem certeza que deseja remover sua chave Pix? Você não poderá receber pagamentos sem ela.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/pix/chave/${userId}`, {
                method: "DELETE",
              });
              if (response.ok) {
                setTipoAtual(null);
                setChaveAtual(null);
                setChave("");
                Alert.alert("Removido", "Chave Pix removida com sucesso.");
              }
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover a chave Pix.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  const tipoInfo = TIPOS_CHAVE.find((t) => t.id === tipoSelecionado);

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ee3f0a" />
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
            <Text style={styles.headerTitle}>Minha Chave Pix</Text>
          </View>

          {/* Chave atual */}
          {chaveAtual && (
            <View style={styles.chaveAtualCard}>
              <View style={styles.chaveAtualHeader}>
                <Feather name="check-circle" size={20} color="#2ecc71" />
                <Text style={styles.chaveAtualTitle}>Chave Pix Cadastrada</Text>
              </View>
              <Text style={styles.chaveAtualTipo}>
                Tipo: {tipoAtual?.toUpperCase()}
              </Text>
              <Text style={styles.chaveAtualValor} selectable>
                {chaveAtual}
              </Text>
              <TouchableOpacity
                style={styles.btnRemover}
                onPress={removerChavePix}
              >
                <Feather name="trash-2" size={16} color="#e74c3c" />
                <Text style={styles.btnRemoverText}>Remover Chave</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Informativo */}
          <View style={styles.infoCard}>
            <Feather name="info" size={18} color="#3498db" />
            <Text style={styles.infoText}>
              Sua chave Pix será exibida aos clientes para que possam realizar
              o pagamento. O valor será separado automaticamente entre o valor
              do produto (para você) e a taxa de entrega (para o entregador).
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {chaveAtual ? "Atualizar Chave Pix" : "Cadastrar Chave Pix"}
            </Text>

            {/* Tipo de chave */}
            <Text style={styles.sectionLabel}>Tipo de Chave</Text>
            <View style={styles.tiposGrid}>
              {TIPOS_CHAVE.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.tipoItem,
                    tipoSelecionado === tipo.id && styles.tipoItemAtivo,
                  ]}
                  onPress={() => {
                    setTipoSelecionado(tipo.id);
                    setChave("");
                  }}
                >
                  <Feather
                    name={tipo.icon as any}
                    size={18}
                    color={tipoSelecionado === tipo.id ? "#ee3f0a" : "#999"}
                  />
                  <Text
                    style={[
                      styles.tipoLabel,
                      tipoSelecionado === tipo.id && styles.tipoLabelAtivo,
                    ]}
                  >
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Campo da chave */}
            <Text style={styles.sectionLabel}>Chave Pix ({tipoInfo?.label})</Text>
            <TextInput
              style={styles.input}
              placeholder={tipoInfo?.placeholder}
              value={chave}
              onChangeText={setChave}
              autoCapitalize="none"
              keyboardType={
                tipoSelecionado === "cpf" || tipoSelecionado === "cnpj" || tipoSelecionado === "telefone"
                  ? "numeric"
                  : "default"
              }
            />

            <TouchableOpacity
              style={[styles.btnSalvar, (!chave.trim() || loading) && styles.btnDesabilitado]}
              onPress={salvarChavePix}
              disabled={!chave.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#fff" />
                  <Text style={styles.btnSalvarText}>
                    {chaveAtual ? "Atualizar Chave" : "Salvar Chave"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Dicas */}
          <View style={styles.dicasCard}>
            <Text style={styles.dicasTitle}>Dicas</Text>
            <View style={styles.dica}>
              <Feather name="check" size={14} color="#2ecc71" />
              <Text style={styles.dicaText}>
                Use a mesma chave cadastrada no seu banco
              </Text>
            </View>
            <View style={styles.dica}>
              <Feather name="check" size={14} color="#2ecc71" />
              <Text style={styles.dicaText}>
                A chave Pix será exibida ao cliente para pagamento
              </Text>
            </View>
            <View style={styles.dica}>
              <Feather name="check" size={14} color="#2ecc71" />
              <Text style={styles.dicaText}>
                O pagamento só é liberado após confirmação com código de 6 dígitos
              </Text>
            </View>
            <View style={styles.dica}>
              <Feather name="check" size={14} color="#2ecc71" />
              <Text style={styles.dicaText}>
                Mantenha sua chave sempre atualizada para receber pagamentos
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  chaveAtualCard: {
    backgroundColor: "#f0fff4",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  chaveAtualHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chaveAtualTitle: { fontSize: 15, fontWeight: "bold", color: "#2ecc71" },
  chaveAtualTipo: { fontSize: 12, color: "#666", marginBottom: 4 },
  chaveAtualValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1,
    marginBottom: 12,
  },
  btnRemover: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  btnRemoverText: { color: "#e74c3c", fontSize: 13, fontWeight: "600" },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#ebf5fb",
    borderRadius: 10,
    padding: 14,
    margin: 12,
    marginBottom: 0,
    borderLeftWidth: 3,
    borderLeftColor: "#3498db",
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 20 },
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
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 16 },
  sectionLabel: { fontSize: 13, color: "#666", marginBottom: 10, marginTop: 4 },
  tiposGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tipoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  tipoItemAtivo: {
    borderColor: "#ee3f0a",
    backgroundColor: "rgba(238,63,10,0.08)",
  },
  tipoLabel: { fontSize: 13, color: "#666", fontWeight: "500" },
  tipoLabelAtivo: { color: "#ee3f0a", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fafafa",
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  btnSalvar: {
    backgroundColor: "#ee3f0a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
  },
  btnDesabilitado: { opacity: 0.5 },
  btnSalvarText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  dicasCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    marginBottom: 0,
  },
  dicasTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 10 },
  dica: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  dicaText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 18 },
});
