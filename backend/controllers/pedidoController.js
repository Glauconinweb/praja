import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const criarPedido = async (req, res) => {
  const { clienteId, lojaId, itens, total } = req.body;
  try {
    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        lojaId,
        total,
        status: "pendente",
        itens: {
          create: itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit
          }))
        }
      }
    });
    res.status(201).json(pedido);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
};

export const atualizarStatusPedido = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { status }
    });

    // Regra: Se o pedido for confirmado como entregue, fecha o chat
    if (status === "entregue") {
      await prisma.chat.updateMany({
        where: { pedidoId: id },
        data: { ativo: false }
      });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar pedido" });
  }
};

export const listarPedidosUsuario = async (req, res) => {
  const { userId } = req.params;
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        OR: [
          { clienteId: userId },
          { lojaId: userId }
        ]
      },
      include: {
        itens: { include: { produto: true } },
        loja: { select: { nome: true } },
        cliente: { select: { nome: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
};
