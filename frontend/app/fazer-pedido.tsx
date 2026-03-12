/**
 * fazer-pedido.tsx
 *
 * Tela completa de pedidos para clientes.
 * Funcionalidades:
 *  - Visualização dos produtos da loja
 *  - Carrinho de compras com adicionar/remover itens
 *  - Filtro por categoria
 *  - Busca de produtos
 *  - Resumo do pedido com taxa de entrega
 *  - Botão para ir ao checkout (seleção de pagamento)
 *  - Informações da loja (nome, endereço, chave Pix)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

const TAXA_ENTREGA_PADRAO = 5.0;

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem?: string;
  categoria: string;
  emEstoque: boolean;
  quantidade: number;
};

type Loja = {
  id: string;
  nome: string;
  descricao?: string;
  endereco?: string;
  telefone?: string;
  foto?: string;
  chavePix?: string;
  tipoChavePix?: string;
  produtos: Produto[];
};

type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
};

type Usuario = {
  id: string;
  nome: string;
  tipo: string;
};

export default function FazerPedidoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lojaId = params.lojaId as string;

  const [loja, setLoja] = useState<Loja | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [modalCarrinhoVisivel, setModalCarrinhoVisivel] = useState(false);
  const [produtoDetalhes, setProdutoDetalhes] = useState<Produto | null>(null);

  useEffect(() => {
    carregarDados();
  }, [lojaId]);

  async function carregarDados() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) setUsuario(JSON.parse(userJson));

      const response = await fetch(`${API_URL}/lojas/${lojaId}`);
      if (response.ok) {
        const data = await response.json();
        setLoja(data);
      } else {
        Alert.alert("Erro", "Loja não encontrada.");
        router.back();
      }
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      Alert.alert("Erro de Conexão", "Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }

  // ── CARRINHO ──────────────────────────────────────────────────────────────

  function adicionarAoCarrinho(produto: Produto) {
    if (!produto.emEstoque || produto.quantidade === 0) {
      Alert.alert("Indisponível", "Este produto está fora de estoque.");
      return;
    }

    setCarrinho((prev) => {
      const existente = prev.find((item) => item.produto.id === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.quantidade) {
          Alert.alert("Limite", `Apenas ${produto.quantidade} unidades disponíveis.`);
          return prev;
        }
        return prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  }

  function removerDoCarrinho(produtoId: string) {
    setCarrinho((prev) => {
      const existente = prev.find((item) => item.produto.id === produtoId);
      if (existente && existente.quantidade > 1) {
        return prev.map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        );
      }
      return prev.filter((item) => item.produto.id !== produtoId);
    });
  }

  function limparCarrinho() {
    Alert.alert("Limpar Carrinho", "Deseja remover todos os itens?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: () => setCarrinho([]) },
    ]);
  }

  function getQuantidadeNoCarrinho(produtoId: string): number {
    return carrinho.find((item) => item.produto.id === produtoId)?.quantidade || 0;
  }

  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const subtotal = carrinho.reduce(
    (acc, item) => acc + item.produto.preco * item.quantidade,
    0
  );
  const taxaEntrega = carrinho.length > 0 ? TAXA_ENTREGA_PADRAO : 0;
  const total = subtotal + taxaEntrega;

  // ── FILTROS ───────────────────────────────────────────────────────────────

  const categorias = loja
    ? ["Todos", ...Array.from(new Set(loja.produtos.map((p) => p.categoria)))]
    : ["Todos"];

  const produtosFiltrados = loja?.produtos.filter((p) => {
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria =
      categoriaAtiva === "Todos" || p.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  }) || [];

  // ── FAZER PEDIDO ──────────────────────────────────────────────────────────

  async function fazerPedido() {
    if (!usuario) {
      Alert.alert("Login Necessário", "Faça login para fazer um pedido.", [
        { text: "Fazer Login", onPress: () => router.push("/Login") },
        { text: "Cancelar", style: "cancel" },
      ]);
      return;
    }

    if (carrinho.length === 0) {
      Alert.alert("Carrinho Vazio", "Adicione produtos ao carrinho.");
      return;
    }

    setEnviandoPedido(true);
    try {
      const itens = carrinho.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
        precoUnit: item.produto.preco,
      }));

      const response = await fetch(`${API_URL}/pedidos/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: usuario.id,
          lojaId,
          itens,
          total,
          taxaEntrega,
          valorProdutos: subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data.error || "Erro ao criar pedido.");
        return;
      }

      setModalCarrinhoVisivel(false);
      setCarrinho([]);

      // Navega para a tela de pagamento
      router.push({
        pathname: "/pagamento",
        params: {
          pedidoId: data.id,
          total: total.toString(),
          taxaEntrega: taxaEntrega.toString(),
          nomeLoja: loja?.nome || "",
        },
      });
    } catch (error) {
      console.error("Erro ao fazer pedido:", error);
      Alert.alert("Erro de Conexão", "Verifique sua conexão e tente novamente.");
    } finally {
      setEnviandoPedido(false);
    }
  }

  // ── RENDERIZAÇÃO ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ee3f0a" />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    );
  }

  if (!loja) return null;

  return (
    <View style={styles.container}>
      {/* Header da loja */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.lojaInfo}>
          {loja.foto ? (
            <Image source={{ uri: loja.foto }} style={styles.lojaFoto} />
          ) : (
            <View style={styles.lojaFotoPlaceholder}>
              <Feather name="shopping-bag" size={24} color="#ee3f0a" />
            </View>
          )}
          <View style={styles.lojaNomeContainer}>
            <Text style={styles.lojaNome} numberOfLines={1}>{loja.nome}</Text>
            {loja.endereco && (
              <View style={styles.lojaEnderecoRow}>
                <Feather name="map-pin" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.lojaEndereco} numberOfLines={1}>
                  {loja.endereco}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botão do carrinho */}
        <TouchableOpacity
          style={styles.carrinhoBtn}
          onPress={() => setModalCarrinhoVisivel(true)}
        >
          <Feather name="shopping-cart" size={22} color="#fff" />
          {totalItens > 0 && (
            <View style={styles.carrinhoBadge}>
              <Text style={styles.carrinhoBadgeText}>{totalItens}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.buscaContainer}>
        <View style={styles.buscaInput}>
          <Feather name="search" size={18} color="#999" style={styles.buscaIcon} />
          <TextInput
            style={styles.buscaTexto}
            placeholder="Buscar produtos..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor="#999"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca("")}>
              <Feather name="x" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasContainer}
        contentContainerStyle={styles.categoriasContent}
      >
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoriaItem,
              categoriaAtiva === cat && styles.categoriaItemAtivo,
            ]}
            onPress={() => setCategoriaAtiva(cat)}
          >
            <Text
              style={[
                styles.categoriaTexto,
                categoriaAtiva === cat && styles.categoriaTextoAtivo,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de produtos */}
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listaProdutos}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color="#ddd" />
            <Text style={styles.emptyText}>
              {busca ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
            </Text>
          </View>
        }
        renderItem={({ item: produto }) => {
          const qtdCarrinho = getQuantidadeNoCarrinho(produto.id);
          const indisponivel = !produto.emEstoque || produto.quantidade === 0;

          return (
            <TouchableOpacity
              style={[styles.produtoCard, indisponivel && styles.produtoIndisponivel]}
              onPress={() => setProdutoDetalhes(produto)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: produto.imagem || "https://via.placeholder.com/100x100/f0f0f0/999?text=Sem+Foto",
                }}
                style={styles.produtoImagem}
              />
              <View style={styles.produtoInfo}>
                <Text style={styles.produtoNome} numberOfLines={1}>
                  {produto.nome}
                </Text>
                {produto.descricao && (
                  <Text style={styles.produtoDescricao} numberOfLines={2}>
                    {produto.descricao}
                  </Text>
                )}
                <View style={styles.produtoRodape}>
                  <Text style={styles.produtoPreco}>
                    R$ {produto.preco.toFixed(2).replace(".", ",")}
                  </Text>
                  {indisponivel ? (
                    <View style={styles.indisponivelBadge}>
                      <Text style={styles.indisponivelText}>Esgotado</Text>
                    </View>
                  ) : qtdCarrinho > 0 ? (
                    <View style={styles.controleQuantidade}>
                      <TouchableOpacity
                        style={styles.btnQuantidade}
                        onPress={() => removerDoCarrinho(produto.id)}
                      >
                        <Feather name="minus" size={16} color="#ee3f0a" />
                      </TouchableOpacity>
                      <Text style={styles.quantidadeTexto}>{qtdCarrinho}</Text>
                      <TouchableOpacity
                        style={styles.btnQuantidade}
                        onPress={() => adicionarAoCarrinho(produto)}
                      >
                        <Feather name="plus" size={16} color="#ee3f0a" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.btnAdicionar}
                      onPress={() => adicionarAoCarrinho(produto)}
                    >
                      <Feather name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Barra flutuante do carrinho */}
      {totalItens > 0 && (
        <TouchableOpacity
          style={styles.barraCarrinho}
          onPress={() => setModalCarrinhoVisivel(true)}
        >
          <View style={styles.barraCarrinhoBadge}>
            <Text style={styles.barraCarrinhoBadgeText}>{totalItens}</Text>
          </View>
          <Text style={styles.barraCarrinhoTexto}>Ver Carrinho</Text>
          <Text style={styles.barraCarrinhoTotal}>
            R$ {total.toFixed(2).replace(".", ",")}
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal de detalhes do produto */}
      <Modal
        visible={!!produtoDetalhes}
        transparent
        animationType="slide"
        onRequestClose={() => setProdutoDetalhes(null)}
      >
        {produtoDetalhes && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalFechar}
                onPress={() => setProdutoDetalhes(null)}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
              <Image
                source={{
                  uri: produtoDetalhes.imagem || "https://via.placeholder.com/300x200/f0f0f0/999?text=Sem+Foto",
                }}
                style={styles.modalImagem}
              />
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalNome}>{produtoDetalhes.nome}</Text>
                <Text style={styles.modalCategoria}>{produtoDetalhes.categoria}</Text>
                {produtoDetalhes.descricao && (
                  <Text style={styles.modalDescricao}>{produtoDetalhes.descricao}</Text>
                )}
                <View style={styles.modalRodape}>
                  <Text style={styles.modalPreco}>
                    R$ {produtoDetalhes.preco.toFixed(2).replace(".", ",")}
                  </Text>
                  {!produtoDetalhes.emEstoque || produtoDetalhes.quantidade === 0 ? (
                    <View style={styles.indisponivelBadge}>
                      <Text style={styles.indisponivelText}>Esgotado</Text>
                    </View>
                  ) : (
                    <View style={styles.controleQuantidade}>
                      <TouchableOpacity
                        style={styles.btnQuantidade}
                        onPress={() => removerDoCarrinho(produtoDetalhes.id)}
                      >
                        <Feather name="minus" size={18} color="#ee3f0a" />
                      </TouchableOpacity>
                      <Text style={styles.quantidadeTexto}>
                        {getQuantidadeNoCarrinho(produtoDetalhes.id)}
                      </Text>
                      <TouchableOpacity
                        style={styles.btnQuantidade}
                        onPress={() => adicionarAoCarrinho(produtoDetalhes)}
                      >
                        <Feather name="plus" size={18} color="#ee3f0a" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal do carrinho */}
      <Modal
        visible={modalCarrinhoVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCarrinhoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalCarrinho]}>
            {/* Header do modal */}
            <View style={styles.modalCarrinhoHeader}>
              <Text style={styles.modalCarrinhoTitulo}>Meu Carrinho</Text>
              <View style={styles.modalCarrinhoHeaderBtns}>
                {carrinho.length > 0 && (
                  <TouchableOpacity onPress={limparCarrinho} style={styles.btnLimpar}>
                    <Feather name="trash-2" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setModalCarrinhoVisivel(false)}
                  style={styles.modalFecharCarrinho}
                >
                  <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {carrinho.length === 0 ? (
              <View style={styles.carrinhoVazio}>
                <Feather name="shopping-cart" size={64} color="#ddd" />
                <Text style={styles.carrinhoVazioTexto}>Seu carrinho está vazio</Text>
                <TouchableOpacity
                  style={styles.btnContinuarComprando}
                  onPress={() => setModalCarrinhoVisivel(false)}
                >
                  <Text style={styles.btnContinuarComprandoTexto}>
                    Continuar Comprando
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView style={styles.carrinhoLista}>
                  {carrinho.map((item) => (
                    <View key={item.produto.id} style={styles.carrinhoItem}>
                      <Image
                        source={{
                          uri: item.produto.imagem || "https://via.placeholder.com/60x60/f0f0f0/999?text=?",
                        }}
                        style={styles.carrinhoItemImagem}
                      />
                      <View style={styles.carrinhoItemInfo}>
                        <Text style={styles.carrinhoItemNome} numberOfLines={1}>
                          {item.produto.nome}
                        </Text>
                        <Text style={styles.carrinhoItemPrecoUnit}>
                          R$ {item.produto.preco.toFixed(2).replace(".", ",")} cada
                        </Text>
                        <Text style={styles.carrinhoItemSubtotal}>
                          Subtotal: R${" "}
                          {(item.produto.preco * item.quantidade)
                            .toFixed(2)
                            .replace(".", ",")}
                        </Text>
                      </View>
                      <View style={styles.controleQuantidade}>
                        <TouchableOpacity
                          style={styles.btnQuantidade}
                          onPress={() => removerDoCarrinho(item.produto.id)}
                        >
                          <Feather name="minus" size={16} color="#ee3f0a" />
                        </TouchableOpacity>
                        <Text style={styles.quantidadeTexto}>{item.quantidade}</Text>
                        <TouchableOpacity
                          style={styles.btnQuantidade}
                          onPress={() => adicionarAoCarrinho(item.produto)}
                        >
                          <Feather name="plus" size={16} color="#ee3f0a" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Resumo financeiro */}
                <View style={styles.resumoFinanceiro}>
                  <View style={styles.resumoLinha}>
                    <Text style={styles.resumoLabel}>Subtotal dos produtos</Text>
                    <Text style={styles.resumoValor}>
                      R$ {subtotal.toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <View style={styles.resumoLinha}>
                    <View style={styles.resumoLabelRow}>
                      <Feather name="truck" size={14} color="#666" />
                      <Text style={styles.resumoLabel}> Taxa de entrega</Text>
                    </View>
                    <Text style={styles.resumoValor}>
                      R$ {taxaEntrega.toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <View style={[styles.resumoLinha, styles.resumoTotal]}>
                    <Text style={styles.resumoTotalLabel}>Total</Text>
                    <Text style={styles.resumoTotalValor}>
                      R$ {total.toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                </View>

                {/* Botão de finalizar */}
                <TouchableOpacity
                  style={[styles.btnFinalizar, enviandoPedido && styles.btnDesabilitado]}
                  onPress={fazerPedido}
                  disabled={enviandoPedido}
                >
                  {enviandoPedido ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={20} color="#fff" />
                      <Text style={styles.btnFinalizarTexto}>
                        Finalizar Pedido
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },

  // Header
  header: {
    backgroundColor: "#ee3f0a",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { padding: 4 },
  lojaInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  lojaFoto: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  lojaFotoPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  lojaNomeContainer: { flex: 1 },
  lojaNome: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  lojaEnderecoRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  lojaEndereco: { fontSize: 11, color: "rgba(255,255,255,0.8)", flex: 1 },
  carrinhoBtn: { padding: 8, position: "relative" },
  carrinhoBadge: {
    position: "absolute", top: 0, right: 0,
    backgroundColor: "#fff",
    borderRadius: 10, width: 20, height: 20,
    justifyContent: "center", alignItems: "center",
  },
  carrinhoBadgeText: { fontSize: 11, fontWeight: "bold", color: "#ee3f0a" },

  // Busca
  buscaContainer: { backgroundColor: "#ee3f0a", paddingHorizontal: 16, paddingBottom: 12 },
  buscaInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 12, height: 42,
  },
  buscaIcon: { marginRight: 8 },
  buscaTexto: { flex: 1, fontSize: 14, color: "#333" },

  // Categorias
  categoriasContainer: { backgroundColor: "#fff", maxHeight: 50 },
  categoriasContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  categoriaItem: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  categoriaItemAtivo: { borderColor: "#ee3f0a", backgroundColor: "rgba(238,63,10,0.08)" },
  categoriaTexto: { fontSize: 13, color: "#666", fontWeight: "500" },
  categoriaTextoAtivo: { color: "#ee3f0a", fontWeight: "bold" },

  // Lista de produtos
  listaProdutos: { padding: 12, paddingBottom: 100 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#999" },

  // Card de produto
  produtoCard: {
    backgroundColor: "#fff", borderRadius: 12,
    marginBottom: 10, flexDirection: "row",
    overflow: "hidden",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4,
    ...Platform.select({ web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" } }),
  },
  produtoIndisponivel: { opacity: 0.6 },
  produtoImagem: { width: 100, height: 100, backgroundColor: "#f0f0f0" },
  produtoInfo: { flex: 1, padding: 12, justifyContent: "space-between" },
  produtoNome: { fontSize: 15, fontWeight: "bold", color: "#333" },
  produtoDescricao: { fontSize: 12, color: "#999", lineHeight: 16, marginTop: 2 },
  produtoRodape: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  produtoPreco: { fontSize: 16, fontWeight: "bold", color: "#ee3f0a" },

  // Controles de quantidade
  controleQuantidade: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnQuantidade: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: "#ee3f0a",
    justifyContent: "center", alignItems: "center",
  },
  quantidadeTexto: { fontSize: 16, fontWeight: "bold", color: "#333", minWidth: 20, textAlign: "center" },
  btnAdicionar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#ee3f0a",
    justifyContent: "center", alignItems: "center",
  },
  indisponivelBadge: {
    backgroundColor: "#f0f0f0", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  indisponivelText: { fontSize: 11, color: "#999", fontWeight: "600" },

  // Barra flutuante do carrinho
  barraCarrinho: {
    position: "absolute", bottom: 16, left: 16, right: 16,
    backgroundColor: "#ee3f0a", borderRadius: 14,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 8, shadowColor: "#ee3f0a", shadowOpacity: 0.4, shadowRadius: 8,
    ...Platform.select({ web: { boxShadow: "0px 4px 16px rgba(238,63,10,0.4)" } }),
  },
  barraCarrinhoBadge: {
    backgroundColor: "#fff", borderRadius: 12,
    width: 28, height: 28, justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  barraCarrinhoBadgeText: { fontSize: 13, fontWeight: "bold", color: "#ee3f0a" },
  barraCarrinhoTexto: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "bold" },
  barraCarrinhoTotal: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Modal de detalhes do produto
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalFechar: {
    position: "absolute", top: 16, right: 16, zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20,
    width: 36, height: 36, justifyContent: "center", alignItems: "center",
  },
  modalImagem: { width: "100%", height: 200, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalScroll: { padding: 20 },
  modalNome: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 4 },
  modalCategoria: {
    fontSize: 12, color: "#ee3f0a", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
  },
  modalDescricao: { fontSize: 14, color: "#666", lineHeight: 22, marginBottom: 16 },
  modalRodape: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 },
  modalPreco: { fontSize: 24, fontWeight: "bold", color: "#ee3f0a" },

  // Modal do carrinho
  modalCarrinho: { maxHeight: "90%", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalCarrinhoHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  modalCarrinhoTitulo: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalCarrinhoHeaderBtns: { flexDirection: "row", alignItems: "center", gap: 12 },
  btnLimpar: { padding: 4 },
  modalFecharCarrinho: { padding: 4 },
  carrinhoVazio: { alignItems: "center", padding: 40, gap: 12 },
  carrinhoVazioTexto: { fontSize: 16, color: "#999" },
  btnContinuarComprando: {
    backgroundColor: "#ee3f0a", borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  btnContinuarComprandoTexto: { color: "#fff", fontWeight: "bold" },
  carrinhoLista: { maxHeight: 300 },
  carrinhoItem: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f5", gap: 12,
  },
  carrinhoItemImagem: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#f0f0f0" },
  carrinhoItemInfo: { flex: 1 },
  carrinhoItemNome: { fontSize: 14, fontWeight: "bold", color: "#333" },
  carrinhoItemPrecoUnit: { fontSize: 12, color: "#999", marginTop: 2 },
  carrinhoItemSubtotal: { fontSize: 13, color: "#ee3f0a", fontWeight: "600", marginTop: 2 },

  // Resumo financeiro
  resumoFinanceiro: {
    padding: 16, borderTopWidth: 1, borderTopColor: "#f0f0f0", gap: 8,
  },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resumoLabelRow: { flexDirection: "row", alignItems: "center" },
  resumoLabel: { fontSize: 14, color: "#666" },
  resumoValor: { fontSize: 14, color: "#333" },
  resumoTotal: {
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
    paddingTop: 8, marginTop: 4,
  },
  resumoTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  resumoTotalValor: { fontSize: 20, fontWeight: "bold", color: "#ee3f0a" },

  // Botão finalizar
  btnFinalizar: {
    backgroundColor: "#ee3f0a", margin: 16,
    padding: 16, borderRadius: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  btnDesabilitado: { opacity: 0.5 },
  btnFinalizarTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
