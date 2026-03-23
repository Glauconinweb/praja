import { PrismaClient } from "@prisma/client";
import GerenciadorEstoque from "./controleestoque/GerenciadorEstoque.js";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// 1. CRIAR PEDIDO (SEGURO + TRANSACTION)
// ─────────────────────────────────────────────
export const criarPedido = async (req, res) => {
  const clienteId = req.user.id;
  const { lojaId, itens, taxaEntrega = 0 } = req.body;

  if (!lojaId || !itens || itens.length === 0) {
    return res.status(400).json({
      error: "Campos obrigatórios: lojaId, itens",
    });
  }

  try {
    const produtos = await prisma.produto.findMany({
      where: {
        id: { in: itens.map(i => i.produtoId) },
        lojaId: lojaId
      },
    });

    if (produtos.length === 0) {
      return res.status(400).json({ error: "Produtos inválidos" });
    }

    let totalCalculado = 0;

    const itensFormatados = itens.map((item) => {
      const produto = produtos.find(p => p.id === item.produtoId);

      if (!produto) {
        throw new Error(`Produto não encontrado: ${item.produtoId}`);
      }

      if (!item.quantidade || item.quantidade <= 0) {
        throw new Error("Quantidade inválida");
      }

      const subtotal = produto.preco * item.quantidade;
      totalCalculado += subtotal;

      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnit: produto.preco,
      };
    });

    const totalFinal = totalCalculado + taxaEntrega;

    const pedido = await prisma.$transaction(async (tx) => {
      // 🔥 Controle de estoque
      for (const item of itensFormatados) {
        const resultado = await GerenciadorEstoque.processarVenda(
          item.produtoId,
          item.quantidade
        );

        if (!resultado.sucesso) {
          throw new Error(resultado.mensagem);
        }
      }

      // 🟢 Criar pedido
      const novoPedido = await tx.pedido.create({
        data: {
          clienteId,
          lojaId,
          entregadorId: null,
          total: totalFinal,
          taxaEntrega,
          valorProdutos: totalCalculado,
          status: "pendente",
          statusPagamento: "pendente",
          itens: {
            create: itensFormatados,
          },
        },
        include: {
          itens: {
            include: {
              produto: { select: { nome: true } },
            },
          },
          loja: {
            select: {
              id: true,
              nome: true,
              vendedor: {
                select: {
                  chavePix: true,
                  tipoChavePix: true,
                },
              },
            },
          },
          cliente: { select: { id: true, nome: true } },
        },
      });

      return novoPedido;
    });

    return res.status(201).json(pedido);

  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return res.status(400).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. ATUALIZAR STATUS (COM CONTROLE)
// ─────────────────────────────────────────────
export const atualizarStatusPedido = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statusValidos = [
    "pendente",
    "confirmado",
    "preparando",
    "em_rota",
    "aguardando_confirmacao",
    "entregue",
    "cancelado",
  ];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({
      error: `Status inválido`,
    });
  }

  if (req.user.tipo !== "VENDEDOR" && req.user.tipo !== "ENTREGADOR") {
    return res.status(403).json({ error: "Sem permissão" });
  }

  try {
    const dadosAtualizacao = { status };

    // 🔐 entregador só pode atribuir a si mesmo
    if (req.user.tipo === "ENTREGADOR") {
      dadosAtualizacao.entregadorId = req.user.id;
    }

    const pedido = await prisma.pedido.update({
      where: { id },
      data: dadosAtualizacao,
    });

    if (status === "entregue") {
      await prisma.chat.updateMany({
        where: { pedidoId: id },
        data: { ativo: false },
      });
    }

    return res.json(pedido);

  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return res.status(500).json({ error: "Erro ao atualizar pedido" });
  }
};

// ─────────────────────────────────────────────
// 3. LISTAR PEDIDOS DO USUÁRIO
// ─────────────────────────────────────────────
export const listarPedidosUsuario = async (req, res) => {
  const userId = req.user.id;

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        OR: [
          { clienteId: userId },
          { entregadorId: userId },
          {
            loja: {
              vendedorId: userId,
            },
          },
        ],
      },
      include: {
        itens: {
          include: {
            produto: { select: { nome: true, imagem: true } },
          },
        },
        loja: {
          select: {
            id: true,
            nome: true,
            foto: true,
            vendedor: {
              select: {
                chavePix: true,
                tipoChavePix: true,
              },
            },
          },
        },
        cliente: { select: { id: true, nome: true } },
        entregador: { select: { id: true, nome: true } },
        pagamento: true,
        transacoes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(pedidos);

  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    return res.status(500).json({ error: "Erro ao listar pedidos" });
  }
};

// ─────────────────────────────────────────────
// 4. BUSCAR PEDIDO POR ID (COM PERMISSÃO)
// ─────────────────────────────────────────────
export const buscarPedidoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { produto: true } },
        loja: {
          include: {
            vendedor: true,
          },
        },
        cliente: true,
        entregador: true,
        pagamento: true,
        transacoes: true,
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // 🔐 controle de acesso completo
    if (
      pedido.clienteId !== req.user.id &&
      pedido.entregadorId !== req.user.id &&
      pedido.loja?.vendedorId !== req.user.id
    ) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return res.json(pedido);

  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return res.status(500).json({ error: "Erro ao buscar pedido" });
  }
};

// ─────────────────────────────────────────────
// 5. PEDIDOS DISPONÍVEIS (SÓ ENTREGADOR)
// ─────────────────────────────────────────────
export const listarPedidosDisponiveis = async (req, res) => {
  if (req.user.tipo !== "ENTREGADOR") {
    return res.status(403).json({ error: "Apenas entregadores" });
  }

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        status: "preparando",
        entregadorId: null,
      },
      include: {
        itens: {
          include: {
            produto: { select: { nome: true } },
          },
        },
        loja: true,
        cliente: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json(pedidos);

  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: "Erro ao listar pedidos" });
  }
};

// ─────────────────────────────────────────────
// 6. ACEITAR PEDIDO (SEGURO)
// ─────────────────────────────────────────────
export const aceitarPedido = async (req, res) => {
  const { id } = req.params;
  const entregadorId = req.user.id;

  if (req.user.tipo !== "ENTREGADOR") {
    return res.status(403).json({ error: "Apenas entregadores" });
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (pedido.entregadorId) {
      return res.status(400).json({ error: "Pedido já foi aceito" });
    }

    const atualizado = await prisma.pedido.update({
      where: { id },
      data: {
        entregadorId,
        status: "em_rota",
      },
    });

    await prisma.transacao.updateMany({
      where: {
        pedidoId: id,
        tipo: "entrega",
      },
      data: {
        entregadorId,
      },
    });

    return res.json({
      message: "Pedido aceito com sucesso",
      pedido: atualizado,
    });

  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: "Erro ao aceitar pedido" });
  }
};