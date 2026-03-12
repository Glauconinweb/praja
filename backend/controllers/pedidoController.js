/**
 * pedidoController.js - Atualizado com suporte a pagamentos, taxa de entrega e entregador
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const criarPedido = async (req, res) => {
  const { clienteId, lojaId, itens, total, taxaEntrega = 0, valorProdutos, entregadorId } = req.body;
  if (!clienteId || !lojaId || !itens || !total) {
    return res.status(400).json({ error: "Campos obrigatórios: clienteId, lojaId, itens, total" });
  }
  try {
    const valorProd = valorProdutos || total - taxaEntrega;
    const pedido = await prisma.pedido.create({
      data: {
        clienteId, lojaId,
        entregadorId: entregadorId || null,
        total, taxaEntrega,
        valorProdutos: valorProd,
        status: "pendente",
        statusPagamento: "pendente",
        itens: {
          create: itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit
          }))
        }
      },
      include: {
        itens: { include: { produto: { select: { nome: true } } } },
        loja: { select: { nome: true, chavePix: true, tipoChavePix: true } },
        cliente: { select: { nome: true } }
      }
    });
    return res.status(201).json(pedido);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return res.status(500).json({ error: "Erro ao criar pedido" });
  }
};

export const atualizarStatusPedido = async (req, res) => {
  const { id } = req.params;
  const { status, entregadorId } = req.body;
  const statusValidos = ["pendente","confirmado","preparando","em_rota","aguardando_confirmacao","entregue","cancelado"];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(", ")}` });
  }
  try {
    const dadosAtualizacao = { status };
    if (entregadorId) dadosAtualizacao.entregadorId = entregadorId;
    const pedido = await prisma.pedido.update({ where: { id }, data: dadosAtualizacao });
    if (status === "entregue") {
      await prisma.chat.updateMany({ where: { pedidoId: id }, data: { ativo: false } });
    }
    return res.json(pedido);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return res.status(500).json({ error: "Erro ao atualizar pedido" });
  }
};

export const listarPedidosUsuario = async (req, res) => {
  const { userId } = req.params;
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { OR: [{ clienteId: userId }, { lojaId: userId }, { entregadorId: userId }] },
      include: {
        itens: { include: { produto: { select: { nome: true, imagem: true } } } },
        loja: { select: { id: true, nome: true, foto: true, chavePix: true, tipoChavePix: true } },
        cliente: { select: { id: true, nome: true } },
        entregador: { select: { id: true, nome: true } },
        pagamento: {
          select: {
            id: true, metodo: true, status: true,
            valorTotal: true, valorProdutos: true, valorTaxaEntrega: true,
            nomeCliente: true, enderecoCliente: true, chavePix: true
          }
        },
        transacoes: { select: { id: true, tipo: true, valor: true, status: true, liberadoEm: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json(pedidos);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    return res.status(500).json({ error: "Erro ao listar pedidos" });
  }
};

export const buscarPedidoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { produto: true } },
        loja: { select: { id: true, nome: true, foto: true, telefone: true, endereco: true, chavePix: true, tipoChavePix: true } },
        cliente: { select: { id: true, nome: true, email: true } },
        entregador: { select: { id: true, nome: true } },
        pagamento: true,
        transacoes: {
          include: {
            vendedor: { select: { nome: true } },
            entregador: { select: { nome: true } }
          }
        }
      }
    });
    if (!pedido) return res.status(404).json({ error: "Pedido não encontrado" });
    return res.json(pedido);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return res.status(500).json({ error: "Erro ao buscar pedido" });
  }
};

export const listarPedidosDisponiveis = async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { status: "preparando", entregadorId: null },
      include: {
        itens: { include: { produto: { select: { nome: true } } } },
        loja: { select: { id: true, nome: true, endereco: true } },
        cliente: { select: { id: true, nome: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    return res.json(pedidos);
  } catch (error) {
    console.error("Erro ao listar pedidos disponíveis:", error);
    return res.status(500).json({ error: "Erro ao listar pedidos disponíveis" });
  }
};

export const aceitarPedido = async (req, res) => {
  const { id } = req.params;
  const { entregadorId } = req.body;
  if (!entregadorId) return res.status(400).json({ error: "entregadorId é obrigatório" });
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id }, select: { id: true, status: true, entregadorId: true } });
    if (!pedido) return res.status(404).json({ error: "Pedido não encontrado" });
    if (pedido.entregadorId) return res.status(400).json({ error: "Pedido já foi aceito por outro entregador" });
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: { entregadorId, status: "em_rota" }
    });
    await prisma.transacao.updateMany({
      where: { pedidoId: id, tipo: "entrega" },
      data: { entregadorId }
    });
    return res.json({ message: "Pedido aceito com sucesso!", pedido: pedidoAtualizado });
  } catch (error) {
    console.error("Erro ao aceitar pedido:", error);
    return res.status(500).json({ error: "Erro ao aceitar pedido" });
  }
};
