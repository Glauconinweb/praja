/**
 * planoController.js
 *
 * Controller responsável pelo gerenciamento de planos para vendedores.
 * Os planos definem limites de produtos, pedidos e taxa da plataforma.
 *
 * INTEGRAÇÃO COM API DE PAGAMENTOS:
 *  O campo `referenciaExterna` na Assinatura está preparado para receber
 *  o ID da transação da API de pagamentos ao assinar um plano pago.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
//  PLANOS PADRÃO DO SISTEMA
// ─────────────────────────────────────────────────────────────────────────────

const PLANOS_PADRAO = [
  {
    nome: "Gratuito",
    descricao: "Ideal para começar. Sem custos mensais.",
    preco: 0,
    duracaoDias: 36500, // 100 anos (permanente)
    maxProdutos: 5,
    maxPedidosMes: 20,
    taxaPlataforma: 5,
    temDestaque: false,
    temRelatorios: false,
    temSuporte: false,
    recursos: [
      "Até 5 produtos cadastrados",
      "Até 20 pedidos por mês",
      "Taxa da plataforma: 5%",
      "Recebimento via Pix",
    ],
  },
  {
    nome: "Básico",
    descricao: "Para vendedores em crescimento.",
    preco: 29.9,
    duracaoDias: 30,
    maxProdutos: 30,
    maxPedidosMes: 100,
    taxaPlataforma: 3,
    temDestaque: false,
    temRelatorios: true,
    temSuporte: false,
    recursos: [
      "Até 30 produtos cadastrados",
      "Até 100 pedidos por mês",
      "Taxa da plataforma: 3%",
      "Relatórios básicos de vendas",
      "Recebimento via Pix e cartão",
    ],
  },
  {
    nome: "Pro",
    descricao: "Para vendedores estabelecidos com alto volume.",
    preco: 79.9,
    duracaoDias: 30,
    maxProdutos: 100,
    maxPedidosMes: 500,
    taxaPlataforma: 1.5,
    temDestaque: true,
    temRelatorios: true,
    temSuporte: false,
    recursos: [
      "Até 100 produtos cadastrados",
      "Até 500 pedidos por mês",
      "Taxa da plataforma: 1,5%",
      "Destaque na listagem de lojas",
      "Relatórios avançados de vendas",
      "Recebimento via Pix, cartão e espécie",
    ],
  },
  {
    nome: "Premium",
    descricao: "Para grandes operações. Sem limites.",
    preco: 149.9,
    duracaoDias: 30,
    maxProdutos: 9999,
    maxPedidosMes: 9999,
    taxaPlataforma: 0,
    temDestaque: true,
    temRelatorios: true,
    temSuporte: true,
    recursos: [
      "Produtos ilimitados",
      "Pedidos ilimitados",
      "Zero taxa da plataforma",
      "Destaque prioritário na listagem",
      "Relatórios completos e exportáveis",
      "Suporte prioritário",
      "Recebimento via todos os métodos",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  1. LISTAR TODOS OS PLANOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/planos
 * Retorna todos os planos ativos disponíveis para vendedores.
 */
export const listarPlanos = async (req, res) => {
  try {
    const planos = await prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { preco: "asc" },
    });

    // Se não houver planos cadastrados, retorna os planos padrão
    if (planos.length === 0) {
      return res.status(200).json({
        planos: PLANOS_PADRAO,
        aviso: "Planos ainda não cadastrados no banco. Use POST /api/planos/seed para inicializar.",
      });
    }

    return res.status(200).json({ planos });
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    return res.status(500).json({ error: "Erro interno ao listar planos" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  2. INICIALIZAR PLANOS PADRÃO (seed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/planos/seed
 * Cria os planos padrão no banco de dados (executar apenas uma vez).
 */
export const seedPlanos = async (req, res) => {
  try {
    const planosExistentes = await prisma.plano.count();
    if (planosExistentes > 0) {
      return res.status(400).json({ error: "Planos já foram inicializados" });
    }

    const planosCriados = await prisma.plano.createMany({
      data: PLANOS_PADRAO,
    });

    return res.status(201).json({
      message: `${planosCriados.count} planos criados com sucesso`,
    });
  } catch (error) {
    console.error("Erro ao criar planos:", error);
    return res.status(500).json({ error: "Erro interno ao criar planos" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  3. ASSINAR UM PLANO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/planos/assinar
 *
 * O vendedor assina um plano. Para planos pagos, a integração com a API
 * de pagamentos deve ser implementada no placeholder abaixo.
 *
 * Body: {
 *   vendedorId: string,
 *   planoId: string,
 *   metodoPagamento?: string  (para planos pagos)
 * }
 */
export const assinarPlano = async (req, res) => {
  const { vendedorId, planoId, metodoPagamento } = req.body;

  if (!vendedorId || !planoId) {
    return res.status(400).json({ error: "Campos obrigatórios: vendedorId, planoId" });
  }

  try {
    const vendedor = await prisma.user.findUnique({
      where: { id: vendedorId },
      select: { id: true, nome: true, tipo: true },
    });

    if (!vendedor || vendedor.tipo !== "vendedor") {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    const plano = await prisma.plano.findUnique({
      where: { id: planoId },
    });

    if (!plano || !plano.ativo) {
      return res.status(404).json({ error: "Plano não encontrado ou inativo" });
    }

    // Para planos pagos, integração com API de pagamentos
    let referenciaExterna = null;
    if (plano.preco > 0) {
      // TODO: Implementar cobrança via API de pagamentos
      // Exemplo:
      // const cobranca = await _processarCobrancaPlano({
      //   vendedorId,
      //   planoId,
      //   valor: plano.preco,
      //   metodoPagamento
      // });
      // referenciaExterna = cobranca.id;
      console.log(`[PLANO] Cobrança de R$ ${plano.preco} para plano ${plano.nome} - integração pendente`);
    }

    // Cancela assinatura ativa anterior
    await prisma.assinatura.updateMany({
      where: { userId: vendedorId, status: "ativa" },
      data: { status: "cancelada" },
    });

    // Calcula data de expiração
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + plano.duracaoDias);

    // Cria nova assinatura
    const assinatura = await prisma.assinatura.create({
      data: {
        userId: vendedorId,
        planoId,
        status: "ativa",
        expiraEm,
        valorPago: plano.preco,
        metodoPagamento: metodoPagamento || null,
        referenciaExterna,
      },
    });

    // Atualiza o vendedor com o plano
    await prisma.user.update({
      where: { id: vendedorId },
      data: {
        planoId,
        planoAtivo: true,
        planoExpiracao: expiraEm,
      },
    });

    return res.status(201).json({
      message: `Plano ${plano.nome} ativado com sucesso!`,
      assinatura: {
        id: assinatura.id,
        plano: plano.nome,
        status: "ativa",
        inicioEm: assinatura.inicioEm,
        expiraEm: assinatura.expiraEm,
        valorPago: assinatura.valorPago,
      },
    });
  } catch (error) {
    console.error("Erro ao assinar plano:", error);
    return res.status(500).json({ error: "Erro interno ao assinar plano" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  4. BUSCAR PLANO ATUAL DO VENDEDOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/planos/vendedor/:vendedorId
 * Retorna o plano atual e assinatura ativa do vendedor.
 */
export const buscarPlanoVendedor = async (req, res) => {
  const { vendedorId } = req.params;

  try {
    const vendedor = await prisma.user.findUnique({
      where: { id: vendedorId },
      include: {
        plano: true,
        assinaturas: {
          where: { status: "ativa" },
          include: { plano: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!vendedor) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    const assinaturaAtiva = vendedor.assinaturas[0] || null;

    return res.status(200).json({
      planoAtual: vendedor.plano,
      assinaturaAtiva: assinaturaAtiva
        ? {
            id: assinaturaAtiva.id,
            plano: assinaturaAtiva.plano.nome,
            status: assinaturaAtiva.status,
            inicioEm: assinaturaAtiva.inicioEm,
            expiraEm: assinaturaAtiva.expiraEm,
            valorPago: assinaturaAtiva.valorPago,
          }
        : null,
      limites: vendedor.plano
        ? {
            maxProdutos: vendedor.plano.maxProdutos,
            maxPedidosMes: vendedor.plano.maxPedidosMes,
            taxaPlataforma: vendedor.plano.taxaPlataforma,
            temDestaque: vendedor.plano.temDestaque,
            temRelatorios: vendedor.plano.temRelatorios,
            temSuporte: vendedor.plano.temSuporte,
          }
        : null,
    });
  } catch (error) {
    console.error("Erro ao buscar plano:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};
