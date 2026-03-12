import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar ou buscar chat para um pedido
export const getOrCreateChat = async (req, res) => {
  const { pedidoId } = req.params;
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { chat: true }
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (pedido.chat) {
      return res.json(pedido.chat);
    }

    // Se o pedido estiver entregue, não abre chat novo
    if (pedido.status === "entregue") {
      return res.status(400).json({ error: "Não é possível abrir chat para pedido já entregue" });
    }

    const chat = await prisma.chat.create({
      data: {
        pedidoId: pedido.id,
        clienteId: pedido.clienteId,
        lojaId: pedido.lojaId,
        ativo: true
      }
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: "Erro ao processar chat" });
  }
};

// Enviar mensagem
export const enviarMensagem = async (req, res) => {
  const { chatId } = req.params;
  const { autorId, texto } = req.body;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { pedido: true }
    });

    if (!chat || !chat.ativo) {
      return res.status(400).json({ error: "Chat inativo ou não encontrado" });
    }

    const mensagem = await prisma.mensagem.create({
      data: {
        chatId,
        autorId,
        texto
      }
    });

    // Aqui poderíamos disparar uma notificação (ex: Socket.io ou Push)
    // Por simplicidade, apenas retornamos a mensagem
    res.status(201).json(mensagem);
  } catch (error) {
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
};

// Listar mensagens de um chat
export const listarMensagens = async (req, res) => {
  const { chatId } = req.params;
  try {
    const mensagens = await prisma.mensagem.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" }
    });
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar mensagens" });
  }
};

// Listar chats ativos do usuário (cliente ou loja)
export const listarChatsAtivos = async (req, res) => {
  const { userId } = req.params;
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { clienteId: userId },
          { lojaId: userId }
        ],
        ativo: true
      },
      include: {
        pedido: true,
        cliente: { select: { nome: true, email: true } },
        loja: { select: { nome: true, email: true } },
        mensagens: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar chats" });
  }
};
