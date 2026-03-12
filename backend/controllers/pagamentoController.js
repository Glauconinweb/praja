/**
 * pagamentoController.js
 *
 * Controller responsável por toda a lógica de pagamentos do Prajá:
 *  - Seleção de método (Pix, Cartão Débito/Crédito, Espécie)
 *  - Geração do código de 6 dígitos para confirmação de entrega
 *  - Separação dos valores: produto (vendedor) e taxa de entrega (entregador)
 *  - Confirmação via código inserido pelo entregador
 *  - Liberação das transações para vendedor e entregador
 *
 * INTEGRAÇÃO COM API DE PAGAMENTOS:
 *  Os campos `apiTransacaoId`, `apiStatus` e `apiResposta` no model Pagamento
 *  estão preparados para receber os dados de qualquer API de pagamentos gratuita.
 *  Basta implementar as funções `_chamarApiPagamento` e `_chamarApiRepasse`
 *  com a API escolhida (ex.: OpenPix, Pagar.me sandbox, Asaas, etc.).
 *
 * PLANOS PARA VENDEDORES:
 *  A taxa da plataforma (`taxaPlataforma`) é definida no Plano do vendedor.
 *  Ao calcular o repasse, o valor da taxa da plataforma é descontado
 *  do valor do produto antes de repassar ao vendedor.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera um código numérico aleatório de 6 dígitos.
 */
function gerarCodigoConfirmacao() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Placeholder para integração futura com API de pagamentos.
 * Substitua o corpo desta função pela chamada real à API escolhida.
 *
 * @param {object} dadosPagamento - Dados do pagamento a ser processado
 * @returns {object} - Resposta simulada da API
 */
async function _chamarApiPagamento(dadosPagamento) {
  // TODO: Implementar integração com API de pagamentos gratuita
  // Exemplos de APIs gratuitas compatíveis:
  //   - OpenPix (https://developers.openpix.com.br)
  //   - Asaas (https://docs.asaas.com)
  //   - Pagar.me sandbox (https://docs.pagar.me)
  //
  // Exemplo de implementação com OpenPix:
  // const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': process.env.OPENPIX_APP_ID,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     correlationID: dadosPagamento.pedidoId,
  //     value: Math.round(dadosPagamento.valor * 100), // em centavos
  //     comment: `Pedido #${dadosPagamento.pedidoId}`
  //   })
  // });
  // return await response.json();

  console.log("[API_PAGAMENTO] Chamada simulada:", dadosPagamento);
  return {
    id: `sim_${Date.now()}`,
    status: "pendente",
    simulado: true,
  };
}

/**
 * Placeholder para integração futura com API de repasse (split de pagamento).
 * Substitua o corpo desta função pela chamada real à API escolhida.
 *
 * @param {object} dadosRepasse - Dados do repasse a ser realizado
 * @returns {object} - Resposta simulada da API
 */
async function _chamarApiRepasse(dadosRepasse) {
  // TODO: Implementar integração com API de repasse/split
  // Muitas APIs de pagamento oferecem split nativo:
  //   - OpenPix: split via subcontas
  //   - Asaas: split de pagamento
  //   - Pagar.me: split rules
  //
  // Exemplo de implementação:
  // const response = await fetch('https://api.openpix.com.br/api/v1/transfer', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': process.env.OPENPIX_APP_ID,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     value: Math.round(dadosRepasse.valor * 100),
  //     destinationAlias: dadosRepasse.chavePix,
  //     correlationID: `repasse_${dadosRepasse.transacaoId}`
  //   })
  // });
  // return await response.json();

  console.log("[API_REPASSE] Chamada simulada:", dadosRepasse);
  return {
    id: `rep_${Date.now()}`,
    status: "processando",
    simulado: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. SELECIONAR MÉTODO DE PAGAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/pagamentos/selecionar-metodo
 *
 * Chamado após o pedido ser criado. O cliente seleciona o método de pagamento
 * e informa nome e endereço. O sistema:
 *  1. Registra o método e dados do cliente
 *  2. Gera o código de 6 dígitos
 *  3. Cria o registro de Pagamento
 *  4. Cria as Transações (produto → vendedor, entrega → entregador)
 *  5. Se Pix, retorna a chave Pix do vendedor para o cliente copiar
 *
 * Body: {
 *   pedidoId: string,
 *   metodo: "pix" | "cartao_debito" | "cartao_credito" | "especie",
 *   nomeCliente: string,
 *   enderecoCliente: string,
 *   taxaEntrega: number  (opcional, padrão 0)
 * }
 */
export const selecionarMetodoPagamento = async (req, res) => {
  const { pedidoId, metodo, nomeCliente, enderecoCliente, taxaEntrega = 0 } = req.body;

  if (!pedidoId || !metodo || !nomeCliente || !enderecoCliente) {
    return res.status(400).json({
      error: "Campos obrigatórios: pedidoId, metodo, nomeCliente, enderecoCliente",
    });
  }

  const metodosValidos = ["pix", "cartao_debito", "cartao_credito", "especie"];
  if (!metodosValidos.includes(metodo)) {
    return res.status(400).json({
      error: `Método inválido. Use: ${metodosValidos.join(", ")}`,
    });
  }

  try {
    // Busca o pedido com dados do vendedor e entregador
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            chavePix: true,
            tipoChavePix: true,
            plano: { select: { taxaPlataforma: true } },
          },
        },
        entregador: {
          select: {
            id: true,
            nome: true,
            chavePix: true,
          },
        },
        pagamento: true,
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (pedido.pagamento) {
      return res.status(400).json({ error: "Pagamento já registrado para este pedido" });
    }

    if (pedido.status === "cancelado" || pedido.status === "entregue") {
      return res.status(400).json({ error: "Pedido não pode receber pagamento neste status" });
    }

    // Calcula valores
    const valorProdutos = pedido.total - (pedido.taxaEntrega || taxaEntrega);
    const valorTaxaEntrega = pedido.taxaEntrega || taxaEntrega;
    const taxaPlataforma = pedido.loja?.plano?.taxaPlataforma || 0;
    const valorVendedor = valorProdutos * (1 - taxaPlataforma / 100);

    // Gera código de 6 dígitos
    const codigoConfirmacao = gerarCodigoConfirmacao();

    // Chave Pix do vendedor (para exibir ao cliente)
    const chavePix = pedido.loja?.chavePix || null;

    // Cria o registro de pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        pedidoId,
        metodo,
        status: "aguardando_confirmacao",
        valorTotal: pedido.total,
        valorProdutos,
        valorTaxaEntrega,
        nomeCliente,
        enderecoCliente,
        chavePix,
        codigoConfirmacao,
      },
    });

    // Atualiza o pedido com os dados de pagamento
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        metodoPagamento: metodo,
        statusPagamento: "aguardando_confirmacao",
        nomeCliente,
        enderecoEntrega: enderecoCliente,
        codigoConfirmacao,
        chavePix,
        taxaEntrega: valorTaxaEntrega,
        valorProdutos,
        status: "confirmado",
      },
    });

    // Cria transação para o vendedor (valor do produto)
    await prisma.transacao.create({
      data: {
        pedidoId,
        tipo: "produto",
        valor: valorVendedor,
        status: "pendente",
        vendedorId: pedido.lojaId,
        chavePix: pedido.loja?.chavePix || null,
      },
    });

    // Cria transação para o entregador (taxa de entrega), se houver entregador
    if (pedido.entregadorId && valorTaxaEntrega > 0) {
      await prisma.transacao.create({
        data: {
          pedidoId,
          tipo: "entrega",
          valor: valorTaxaEntrega,
          status: "pendente",
          entregadorId: pedido.entregadorId,
          chavePix: pedido.entregador?.chavePix || null,
        },
      });
    }

    // Chama API de pagamento (placeholder para integração futura)
    const respostaApi = await _chamarApiPagamento({
      pedidoId,
      metodo,
      valor: pedido.total,
      nomeCliente,
      enderecoCliente,
      chavePix,
    });

    // Atualiza pagamento com resposta da API
    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        apiTransacaoId: respostaApi.id,
        apiStatus: respostaApi.status,
        apiResposta: JSON.stringify(respostaApi),
      },
    });

    return res.status(201).json({
      message: "Pagamento registrado com sucesso",
      pagamento: {
        id: pagamento.id,
        metodo,
        status: "aguardando_confirmacao",
        valorTotal: pedido.total,
        valorProdutos,
        valorTaxaEntrega,
        nomeCliente,
        enderecoCliente,
        // Código de 6 dígitos enviado ao cliente para confirmar entrega
        codigoConfirmacao,
        // Chave Pix do vendedor (apenas para método Pix)
        chavePix: metodo === "pix" ? chavePix : null,
        tipoChavePix: metodo === "pix" ? pedido.loja?.tipoChavePix : null,
        nomeLoja: pedido.loja?.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao selecionar método de pagamento:", error);
    return res.status(500).json({ error: "Erro interno ao processar pagamento" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  2. CONFIRMAR ENTREGA COM CÓDIGO DE 6 DÍGITOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/pagamentos/confirmar-entrega
 *
 * O entregador insere o código de 6 dígitos recebido do cliente.
 * Ao confirmar:
 *  1. Valida o código
 *  2. Marca o pedido como "entregue"
 *  3. Libera as transações para vendedor e entregador
 *  4. Chama a API de repasse (placeholder)
 *
 * Body: {
 *   pedidoId: string,
 *   entregadorId: string,
 *   codigo: string (6 dígitos)
 * }
 */
export const confirmarEntregaComCodigo = async (req, res) => {
  const { pedidoId, entregadorId, codigo } = req.body;

  if (!pedidoId || !entregadorId || !codigo) {
    return res.status(400).json({
      error: "Campos obrigatórios: pedidoId, entregadorId, codigo",
    });
  }

  if (codigo.length !== 6 || !/^\d{6}$/.test(codigo)) {
    return res.status(400).json({ error: "Código deve ter exatamente 6 dígitos numéricos" });
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        pagamento: true,
        transacoes: true,
        loja: { select: { id: true, nome: true, chavePix: true } },
        entregador: { select: { id: true, nome: true, chavePix: true } },
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (!pedido.pagamento) {
      return res.status(400).json({ error: "Pagamento não registrado para este pedido" });
    }

    if (pedido.status === "entregue") {
      return res.status(400).json({ error: "Pedido já foi confirmado como entregue" });
    }

    if (pedido.status === "cancelado") {
      return res.status(400).json({ error: "Pedido cancelado não pode ser confirmado" });
    }

    // Valida o código de 6 dígitos
    if (pedido.pagamento.codigoConfirmacao !== codigo) {
      return res.status(400).json({ error: "Código de confirmação inválido" });
    }

    const agora = new Date();

    // Atualiza o pagamento como confirmado
    await prisma.pagamento.update({
      where: { id: pedido.pagamento.id },
      data: {
        status: "confirmado",
        codigoConfirmadoEm: agora,
        codigoConfirmadoPor: entregadorId,
      },
    });

    // Atualiza o pedido como entregue
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        status: "entregue",
        statusPagamento: "confirmado",
        codigoConfirmadoEm: agora,
        entregadorId,
      },
    });

    // Fecha o chat do pedido
    await prisma.chat.updateMany({
      where: { pedidoId },
      data: { ativo: false },
    });

    // Libera as transações e chama API de repasse
    const transacoes = pedido.transacoes;
    const transacoesAtualizadas = [];

    for (const transacao of transacoes) {
      if (transacao.status === "pendente") {
        // Chama API de repasse (placeholder)
        const respostaRepasse = await _chamarApiRepasse({
          transacaoId: transacao.id,
          tipo: transacao.tipo,
          valor: transacao.valor,
          chavePix: transacao.chavePix,
          destinatario:
            transacao.tipo === "produto"
              ? pedido.loja?.nome
              : pedido.entregador?.nome,
        });

        const transacaoAtualizada = await prisma.transacao.update({
          where: { id: transacao.id },
          data: {
            status: "liberado",
            liberadoEm: agora,
            apiTransacaoId: respostaRepasse.id,
            apiStatus: respostaRepasse.status,
          },
        });

        transacoesAtualizadas.push(transacaoAtualizada);
      }
    }

    // Atualiza pagamento como distribuído
    await prisma.pagamento.update({
      where: { id: pedido.pagamento.id },
      data: { status: "distribuido" },
    });

    return res.status(200).json({
      message: "Entrega confirmada com sucesso! Valores liberados.",
      pedido: {
        id: pedidoId,
        status: "entregue",
        statusPagamento: "distribuido",
      },
      transacoes: transacoesAtualizadas.map((t) => ({
        tipo: t.tipo,
        valor: t.valor,
        status: t.status,
        liberadoEm: t.liberadoEm,
      })),
    });
  } catch (error) {
    console.error("Erro ao confirmar entrega:", error);
    return res.status(500).json({ error: "Erro interno ao confirmar entrega" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  3. BUSCAR DETALHES DO PAGAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/pagamentos/pedido/:pedidoId
 *
 * Retorna os detalhes do pagamento de um pedido.
 * Inclui chave Pix do vendedor (se método Pix), código de confirmação
 * e status das transações.
 */
export const buscarPagamentoPorPedido = async (req, res) => {
  const { pedidoId } = req.params;

  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { pedidoId },
    });

    if (!pagamento) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    const transacoes = await prisma.transacao.findMany({
      where: { pedidoId },
      include: {
        vendedor: { select: { nome: true } },
        entregador: { select: { nome: true } },
      },
    });

    return res.status(200).json({
      pagamento: {
        ...pagamento,
        // Não expõe o código de confirmação para segurança
        codigoConfirmacao: undefined,
      },
      transacoes: transacoes.map((t) => ({
        id: t.id,
        tipo: t.tipo,
        valor: t.valor,
        status: t.status,
        destinatario: t.tipo === "produto" ? t.vendedor?.nome : t.entregador?.nome,
        liberadoEm: t.liberadoEm,
        pagoEm: t.pagoEm,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error);
    return res.status(500).json({ error: "Erro interno ao buscar pagamento" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  4. BUSCAR CÓDIGO DE CONFIRMAÇÃO (apenas para o cliente do pedido)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/pagamentos/codigo/:pedidoId/:clienteId
 *
 * Retorna o código de 6 dígitos para o cliente exibir ao entregador.
 * Apenas o cliente do pedido pode acessar este endpoint.
 */
export const buscarCodigoConfirmacao = async (req, res) => {
  const { pedidoId, clienteId } = req.params;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        clienteId: true,
        codigoConfirmacao: true,
        status: true,
        metodoPagamento: true,
        statusPagamento: true,
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (pedido.clienteId !== clienteId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (!pedido.codigoConfirmacao) {
      return res.status(404).json({ error: "Código de confirmação não gerado ainda" });
    }

    return res.status(200).json({
      codigoConfirmacao: pedido.codigoConfirmacao,
      metodoPagamento: pedido.metodoPagamento,
      statusPagamento: pedido.statusPagamento,
      instrucao:
        "Mostre este código ao entregador após receber seu pedido para confirmar a entrega.",
    });
  } catch (error) {
    console.error("Erro ao buscar código:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  5. LISTAR TRANSAÇÕES DE UM USUÁRIO (vendedor ou entregador)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/pagamentos/transacoes/:userId
 *
 * Lista todas as transações de um vendedor ou entregador.
 */
export const listarTransacoesUsuario = async (req, res) => {
  const { userId } = req.params;

  try {
    const transacoes = await prisma.transacao.findMany({
      where: {
        OR: [{ vendedorId: userId }, { entregadorId: userId }],
      },
      include: {
        pedido: {
          select: {
            id: true,
            createdAt: true,
            nomeCliente: true,
            metodoPagamento: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = transacoes.reduce((acc, t) => acc + t.valor, 0);
    const totalLiberado = transacoes
      .filter((t) => t.status === "liberado" || t.status === "pago")
      .reduce((acc, t) => acc + t.valor, 0);
    const totalPendente = transacoes
      .filter((t) => t.status === "pendente")
      .reduce((acc, t) => acc + t.valor, 0);

    return res.status(200).json({
      transacoes,
      resumo: {
        total,
        totalLiberado,
        totalPendente,
        quantidade: transacoes.length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar transações:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};
