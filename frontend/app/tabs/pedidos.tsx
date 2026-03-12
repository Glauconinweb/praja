/**
 * pedidos.tsx (tabs) - Atualizado com suporte a pagamentos e confirmação de entrega
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

interface UsuarioData {
  id: string;
  nome: string;
  email: string;
  tipo: "cliente" | "vendedor" | "entregador";
  token: string;
}

interface ItemPedido {
  quantidade: number;
  produto: { nome: string; imagem?: string };
}

interface Pagamento {
  id: string;
  metodo: string;
  status: string;
  valorTotal: number;
  valorProdutos: number;
  valorTaxaEntrega: number;
  nomeCliente?: string;
  enderecoCliente?: string;
  chavePix?: string;
}

interface Transacao {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  liberadoEm?: string;
}

interface Pedido {
  id: string;
  status: string;
  statusPagamento?: string;
  createdAt: string;
  total: number;
  taxaEntrega?: number;
  valorProdutos?: number;
  codigoConfirmacao?: string;
  metodoPagamento?: string;
  nomeCliente?: string;
  enderecoEntrega?: string;
  loja: { id: string; nome: string; chavePix?: string; tipoChavePix?: string };
  cliente: { id: string; nome: string };
  entregador?: { id: string; nome: string };
  itens: ItemPedido[];
  pagamento?: Pagamento;
  transacoes?: Transacao[];
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  em_rota: "Em Rota",
  aguardando_confirmacao: "Aguardando",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const METODO_LABELS: Record<string, string> = {
  pix: "Pix",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
  especie: "Dinheiro",
};

export default function PedidosScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
    }, [])
  );

  async function carregarPedidos(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) { setLoading(false); setRefreshing(false); return; }
      const user: UsuarioData = JSON.parse(userJson);
      setUsuario(user);
      const response = await fetch(`${API_URL}/pedidos/usuario/${user.id}`);
      const data = await response.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function abrirChat(pedido: Pedido) {
    try {
      const response = await fetch(`${API_URL}/chat/pedido/${pedido.id}`);
      const chat = await response.json();
      if (!usuario) return;
      const nomeOutro = usuario.tipo === "cliente" ? pedido.loja.nome : pedido.cliente.nome;
      router.push({ pathname: "/chat", params: { chatId: chat.id, pedidoId: pedido.id, nomeOutro } });
    } catch (error) {
      console.error("Erro ao abrir chat:", error);
    }
  }

  function irParaPagamento(pedido: Pedido) {
    router.push({
      pathname: "/pagamento",
      params: {
        pedidoId: pedido.id,
        total: pedido.total.toString(),
        taxaEntrega: (pedido.taxaEntrega || 0).toString(),
        nomeLoja: pedido.loja.nome,
      },
    });
  }

  function irParaConfirmarEntrega(pedido: Pedido) {
    router.push({
      pathname: "/confirmar-entrega",
      params: {
        pedidoId: pedido.id,
        nomeCliente: pedido.nomeCliente || pedido.cliente?.nome || "",
        enderecoEntrega: pedido.enderecoEntrega || "",
        valorTotal: pedido.total.toString(),
        metodoPagamento: pedido.metodoPagamento || "",
      },
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pendente": return "#f39c12";
      case "confirmado": return "#3498db";
      case "preparando": return "#9b59b6";
      case "em_rota": return "#e67e22";
      case "aguardando_confirmacao": return "#1abc9c";
      case "entregue": return "#2ecc71";
      case "cancelado": return "#e74c3c";
      default: return "#95a5a6";
    }
  }

  const renderPedido = ({ item }: { item: Pedido }) => {
    const isCliente = usuario?.tipo === "cliente";
    const isEntregador = usuario?.tipo === "entregador";
    const isVendedor = usuario?.tipo === "vendedor";

    const precisaPagamento =
      isCliente &&
      (!item.statusPagamento || item.statusPagamento === "pendente") &&
      item.status !== "cancelado" && item.status !== "entregue";

    const podeConfirmarEntrega =
      isEntregador &&
      item.entregador?.id === usuario?.id &&
      (item.status === "em_rota" || item.status === "aguardando_confirmacao");

    const mostrarCodigo =
      isCliente &&
      item.codigoConfirmacao &&
      item.status !== "entregue" && item.status !== "cancelado" &&
      item.statusPagamento === "aguardando_confirmacao";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.lojaNome} numberOfLines={1}>{item.loja.nome}</Text>
            <Text style={styles.dataText}>
              {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit"
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {STATUS_LABELS[item.status] || item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.itensContainer}>
          {item.itens.map((i: ItemPedido, idx: number) => (
            <Text key={idx} style={styles.itemText}>
              <Text style={{ fontWeight: "bold" }}>{i.quantidade}x</Text> {i.produto.nome}
            </Text>
          ))}
        </View>

        <View style={styles.valoresBox}>
          {item.valorProdutos !== undefined && (
            <View style={styles.valorRow}>
              <Text style={styles.valorLabel}>Produtos:</Text>
              <Text style={styles.valorText}>R$ {(item.valorProdutos || 0).toFixed(2).replace(".", ",")}</Text>
            </View>
          )}
          {item.taxaEntrega !== undefined && (
            <View style={styles.valorRow}>
              <Text style={styles.valorLabel}>Entrega:</Text>
              <Text style={styles.valorText}>R$ {(item.taxaEntrega || 0).toFixed(2).replace(".", ",")}</Text>
            </View>
          )}
          <View style={[styles.valorRow, { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 6, marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValor}>R$ {item.total.toFixed(2).replace(".", ",")}</Text>
          </View>
        </View>

        {item.metodoPagamento && (
          <Text style={styles.metodoPagText}>
            Pagamento: {METODO_LABELS[item.metodoPagamento] || item.metodoPagamento}
          </Text>
        )}

        {mostrarCodigo && (
          <View style={styles.codigoBox}>
            <Text style={styles.codigoTitulo}>Código de Entrega</Text>
            <View style={styles.codigoDigitos}>
              {item.codigoConfirmacao!.split("").map((d, i) => (
                <View key={i} style={styles.codigoDigito}>
                  <Text style={styles.codigoDigitoText}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.codigoAviso}>Mostre ao entregador para confirmar</Text>
          </View>
        )}

        {isVendedor && item.entregador && (
          <Text style={styles.entregadorText}>
            Entregador: {item.entregador.nome}
          </Text>
        )}

        <View style={styles.acoes}>
          {precisaPagamento && (
            <TouchableOpacity style={styles.btnPagamento} onPress={() => irParaPagamento(item)}>
              <Feather name="credit-card" size={15} color="#fff" />
              <Text style={styles.btnText}>Escolher Pagamento</Text>
            </TouchableOpacity>
          )}
          {podeConfirmarEntrega && (
            <TouchableOpacity style={styles.btnConfirmar} onPress={() => irParaConfirmarEntrega(item)}>
              <Feather name="check-circle" size={15} color="#fff" />
              <Text style={styles.btnText}>Confirmar Entrega</Text>
            </TouchableOpacity>
          )}
          {item.status !== "entregue" && item.status !== "cancelado" && (
            <TouchableOpacity style={styles.chatBtn} onPress={() => abrirChat(item)}>
              <Feather name="message-circle" size={15} color="#fff" />
              <Text style={styles.btnText}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#ee3f0a" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Meus Pedidos</Text>
        <TouchableOpacity onPress={() => carregarPedidos(true)} style={{ padding: 4 }}>
          <Feather name="refresh-cw" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderPedido}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => carregarPedidos(true)} colors={["#ee3f0a"]} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
            <Feather name="shopping-bag" size={64} color="#ddd" />
            <Text style={styles.vazio}>Nenhum pedido encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    backgroundColor: "#ee3f0a",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  lista: { padding: 12, paddingBottom: 30 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  lojaNome: { fontSize: 17, fontWeight: "bold", color: "#333" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  dataText: { fontSize: 12, color: "#999", marginTop: 3 },
  itensContainer: {
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
    paddingTop: 10, marginBottom: 10, gap: 4,
  },
  itemText: { fontSize: 14, color: "#555" },
  valoresBox: {
    backgroundColor: "#f8f8f8", borderRadius: 8,
    padding: 10, marginBottom: 10, gap: 4,
  },
  valorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  valorLabel: { fontSize: 13, color: "#666" },
  valorText: { fontSize: 13, color: "#333" },
  totalLabel: { fontSize: 15, fontWeight: "bold", color: "#333" },
  totalValor: { fontSize: 16, fontWeight: "bold", color: "#ee3f0a" },
  metodoPagText: { fontSize: 12, color: "#888", marginBottom: 8 },
  codigoBox: {
    backgroundColor: "#fff8f6", borderRadius: 10, padding: 12,
    marginBottom: 10, borderWidth: 1.5, borderColor: "#ee3f0a", alignItems: "center",
  },
  codigoTitulo: { fontSize: 13, fontWeight: "bold", color: "#ee3f0a", marginBottom: 8 },
  codigoDigitos: { flexDirection: "row", gap: 6, marginBottom: 6 },
  codigoDigito: {
    width: 34, height: 42, backgroundColor: "#fff",
    borderRadius: 8, borderWidth: 1.5, borderColor: "#ee3f0a",
    justifyContent: "center", alignItems: "center",
  },
  codigoDigitoText: { fontSize: 18, fontWeight: "bold", color: "#ee3f0a" },
  codigoAviso: { fontSize: 11, color: "#888" },
  entregadorText: { fontSize: 13, color: "#555", marginBottom: 10 },
  acoes: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  btnPagamento: {
    backgroundColor: "#ee3f0a", flexDirection: "row", alignItems: "center",
    gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: "center",
  },
  btnConfirmar: {
    backgroundColor: "#2ecc71", flexDirection: "row", alignItems: "center",
    gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: "center",
  },
  chatBtn: {
    backgroundColor: "#3498db", flexDirection: "row", alignItems: "center",
    gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  vazio: { textAlign: "center", marginTop: 50, color: "#999", fontSize: 16 },
});