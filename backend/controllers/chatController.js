import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Criar ou buscar chat para um pedido
 * - Chat é criado apenas se o pedido foi pago (statusPagamento !== "pendente")
 * - Chat é desativado automaticamente quando o pedido é entregue
 * - Cada cliente tem um chat individual por loja
 */
export const getOrCreateChat = async (req, res) => {
  const { pedidoId } = req.params;
  const userId = req.user.id;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        chat: {
          include: {
            mensagens: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
        loja: {
          select: {
            id: true,
            nome: true,
            vendedorId: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Validar permissão: apenas cliente ou vendedor da loja podem acessar o chat
    if (userId !== pedido.clienteId && userId !== pedido.loja.vendedorId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Se o pedido estiver entregue, não abre chat novo
    if (pedido.status === "entregue") {
      return res.status(400).json({
        error: "Não é possível abrir chat para pedido já entregue",
      });
    }

    // Se o chat já existe, retornar
    if (pedido.chat) {
      return res.json(pedido.chat);
    }

    // Criar chat apenas se o pedido foi pago (statusPagamento !== "pendente")
    if (pedido.statusPagamento === "pendente") {
      return res.status(400).json({
        error: "Chat disponível apenas após confirmação de pagamento",
      });
    }

    // Criar novo chat
    const chat = await prisma.chat.create({
      data: {
        pedidoId: pedido.id,
        clienteId: pedido.clienteId,
        lojaId: pedido.lojaId,
        ativo: true,
      },
      include: {
        mensagens: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return res.status(201).json(chat);
  } catch (error) {
    console.error("Erro ao processar chat:", error);
    return res.status(500).json({ error: "Erro ao processar chat" });
  }
};

/**
 * Enviar mensagem no chat
 * - O autorId é derivado do req.user.id (autenticado), não do corpo da requisição
 * - Chat deve estar ativo
 * - Usuário deve ser cliente ou vendedor da loja
 */
export const enviarMensagem = async (req, res) => {
  const { chatId } = req.params;
  const { texto } = req.body;
  const userId = req.user.id;

  if (!texto || texto.trim() === "") {
    return res.status(400).json({ error: "Texto da mensagem é obrigatório" });
  }

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        pedido: true,
        loja: {
          select: {
            vendedorId: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    if (!chat.ativo) {
      return res.status(400).json({
        error: "Chat inativo. Pedido já foi entregue.",
      });
    }

    // Validar permissão: apenas cliente ou vendedor da loja podem enviar mensagens
    if (userId !== chat.clienteId && userId !== chat.loja.vendedorId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Criar mensagem com autorId do usuário autenticado
    const mensagem = await prisma.mensagem.create({
      data: {
        chatId,
        autorId: userId,
        texto: texto.trim(),
      },
    });

    return res.status(201).json(mensagem);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
};

/**
 * Listar mensagens de um chat
 * - Apenas cliente ou vendedor da loja podem listar mensagens
 */
export const listarMensagens = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        loja: {
          select: {
            vendedorId: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    // Validar permissão
    if (userId !== chat.clienteId && userId !== chat.loja.vendedorId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const mensagens = await prisma.mensagem.findMany({
      where: { chatId },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            foto: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json(mensagens);
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);
    return res.status(500).json({ error: "Erro ao listar mensagens" });
  }
};

/**
 * Listar chats ativos do usuário (cliente ou loja)
 * - Retorna apenas chats ativos
 * - Inclui informações do pedido, cliente e loja
 * - Última mensagem de cada chat
 */
export const listarChatsAtivos = async (req, res) => {
  const userId = req.user.id;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ clienteId: userId }, { loja: { vendedorId: userId } }],
        ativo: true,
      },
      include: {
        pedido: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            foto: true,
          },
        },
        loja: {
          select: {
            id: true,
            nome: true,
            foto: true,
          },
        },
        mensagens: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            autor: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(chats);
  } catch (error) {
    console.error("Erro ao listar chats:", error);
    return res.status(500).json({ error: "Erro ao listar chats" });
  }
};

/**
 * Buscar um chat específico com todas as suas informações
 * - Apenas cliente ou vendedor da loja podem acessar
 */
export const buscarChatPorId = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        pedido: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            itens: {
              include: {
                produto: {
                  select: {
                    nome: true,
                    preco: true,
                  },
                },
              },
            },
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            foto: true,
            telefone: true,
          },
        },
        loja: {
          select: {
            id: true,
            nome: true,
            foto: true,
            telefone: true,
            endereco: true,
          },
        },
        mensagens: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
                foto: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    // Validar permissão
    if (userId !== chat.cliente.id && userId !== chat.loja.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return res.json(chat);
  } catch (error) {
    console.error("Erro ao buscar chat:", error);
    return res.status(500).json({ error: "Erro ao buscar chat" });
  }
};

/**
 * Marcar mensagens como lidas
 * - Apenas para mensagens que o usuário não enviou
 */
export const marcarMensagensComoLidas = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        loja: {
          select: {
            vendedorId: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    // Validar permissão
    if (userId !== chat.clienteId && userId !== chat.loja.vendedorId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Marcar mensagens como lidas (exceto as do próprio usuário)
    const resultado = await prisma.mensagem.updateMany({
      where: {
        chatId,
        autorId: { not: userId },
        lida: false,
      },
      data: {
        lida: true,
      },
    });

    return res.json({
      message: "Mensagens marcadas como lidas",
      count: resultado.count,
    });
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    return res
      .status(500)
      .json({ error: "Erro ao marcar mensagens como lidas" });
  }
};
