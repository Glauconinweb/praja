import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────
function gerarCodigoConfirmacao() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────
// 1. SELECIONAR MÉTODO DE PAGAMENTO (SEGURO)
// ─────────────────────────────────────────────
export const selecionarMetodoPagamento = async (req, res) => {
  const userId = req.user.id;

  const {
    pedidoId,
    metodo,
    nomeCliente,
    enderecoCliente,
    taxaEntrega = 0,
  } = req.body;

  const metodosValidos = ["pix", "cartao", "especie"];

  if (!pedidoId || !metodo || !nomeCliente || !enderecoCliente) {
    return res.status(400).json({
      error: "Campos obrigatórios faltando",
    });
  }

  if (!metodosValidos.includes(metodo)) {
    return res.status(400).json({
      error: "Método inválido",
    });
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        loja: {
          include: { vendedor: true },
        },
        pagamento: true,
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // 🔐 só o cliente pode pagar
    if (pedido.clienteId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (pedido.pagamento) {
      return res.status(400).json({ error: "Pagamento já existe" });
    }

    const valorProdutos = pedido.total - (pedido.taxaEntrega || taxaEntrega);
    const valorTaxaEntrega = pedido.taxaEntrega || taxaEntrega;

    const codigoConfirmacao = gerarCodigoConfirmacao();

    await prisma.$transaction(async (tx) => {
      await tx.pagamento.create({
        data: {
          pedidoId,
          metodo,
          status: "aguardando_confirmacao",
          valorTotal: pedido.total,
          valorProdutos,
          valorTaxaEntrega,
          nomeCliente,
          enderecoCliente,
          codigoConfirmacao,
          chavePix: pedido.loja?.vendedor?.chavePix || null,
        },
      });

      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          statusPagamento: "aguardando_confirmacao",
          metodoPagamento: metodo,
          codigoConfirmacao,
          status: "confirmado",
        },
      });

      // transação produto
      await tx.transacao.create({
        data: {
          pedidoId,
          tipo: "produto",
          valor: valorProdutos,
          status: "pendente",
          vendedorId: pedido.loja.vendedor.id,
        },
      });

      // transacao entrega
      if (valorTaxaEntrega > 0) {
        await tx.transacao.create({
          data: {
            pedidoId,
            tipo: "entrega",
            valor: valorTaxaEntrega,
            status: "pendente",
          },
        });
      }

      // Criar chat automaticamente quando o pagamento eh confirmado
      await tx.chat.create({
        data: {
          pedidoId,
          clienteId: pedido.clienteId,
          lojaId: pedido.lojaId,
          ativo: true,
        },
      });
    });

    return res.status(201).json({
      message: "Pagamento criado",
      codigoConfirmacao,
      chavePix:
        metodo === "pix" ? pedido.loja?.vendedor?.chavePix : null,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao processar pagamento" });
  }
};

// ─────────────────────────────────────────────
// 2. CONFIRMAR ENTREGA (SEGURO)
// ─────────────────────────────────────────────
export const confirmarEntregaComCodigo = async (req, res) => {
  const userId = req.user.id;
  const { pedidoId, codigo } = req.body;

  if (!pedidoId || !codigo) {
    return res.status(400).json({
      error: "pedidoId e código obrigatórios",
    });
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        pagamento: true,
        transacoes: true,
      },
    });

    if (!pedido || !pedido.pagamento) {
      return res.status(404).json({
        error: "Pedido ou pagamento não encontrado",
      });
    }

    // 🔐 só o entregador pode confirmar
    if (pedido.entregadorId !== userId) {
      return res.status(403).json({
        error: "Apenas o entregador pode confirmar",
      });
    }

    if (pedido.pagamento.codigoConfirmacao !== codigo) {
      return res.status(400).json({
        error: "Código inválido",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { id: pedido.pagamento.id },
        data: { status: "confirmado" },
      });

      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          status: "entregue",
          statusPagamento: "confirmado",
        },
      });

      await tx.transacao.updateMany({
        where: { pedidoId },
        data: {
          status: "liberado",
          liberadoEm: new Date(),
        },
      });

      // Desativar chat quando a entrega é confirmada
      await tx.chat.updateMany({
        where: { pedidoId },
        data: { ativo: false },
      });
    });

    return res.json({
      message: "Entrega confirmada!",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao confirmar entrega",
    });
  }
};

// ─────────────────────────────────────────────
// 3. BUSCAR PAGAMENTO (COM PERMISSÃO)
// ─────────────────────────────────────────────
export const buscarPagamentoPorPedido = async (req, res) => {
  const userId = req.user.id;
  const { pedidoId } = req.params;

  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { pedidoId },
      include: {
        pedido: {
          include: {
            loja: true,
          },
        },
      },
    });

    if (!pagamento) {
      return res.status(404).json({
        error: "Pagamento não encontrado",
      });
    }

    const pedido = pagamento.pedido;

    // 🔐 controle de acesso
    if (
      pedido.clienteId !== userId &&
      pedido.entregadorId !== userId &&
      pedido.loja?.vendedorId !== userId
    ) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return res.json(pagamento);

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao buscar pagamento",
    });
  }
};

// ─────────────────────────────────────────────
// 4. BUSCAR CÓDIGO (SÓ CLIENTE)
// ─────────────────────────────────────────────
export const buscarCodigoConfirmacao = async (req, res) => {
  const userId = req.user.id;
  const { pedidoId } = req.params;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        clienteId: true,
        codigoConfirmacao: true,
      },
    });

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado",
      });
    }

    // 🔐 só o cliente pode ver
    if (pedido.clienteId !== userId) {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    return res.json({
      codigoConfirmacao: pedido.codigoConfirmacao,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao buscar código",
    });
  }
};

// ─────────────────────────────────────────────
// 5. LISTAR TRANSAÇÕES (SEGURO)
// ─────────────────────────────────────────────
export const listarTransacoesUsuario = async (req, res) => {
  const userId = req.user.id;

  try {
    const transacoes = await prisma.transacao.findMany({
      where: {
        OR: [
          { vendedorId: userId },
          { entregadorId: userId },
        ],
      },
      include: {
        pedido: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(transacoes);

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao listar transações",
    });
  }
};