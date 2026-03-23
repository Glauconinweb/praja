import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deletarTudo() {
  try {
    // 1. Transações (se existir relação)
    await prisma.transacao.deleteMany();

    // 2. Pagamentos (NOVO - resolve seu erro atual)
    await prisma.pagamento.deleteMany();

    // 3. Itens de pedido
    await prisma.itemPedido.deleteMany();

    // 4. Pedidos
    await prisma.pedido.deleteMany();

    // 5. Produtos
    const resultado = await prisma.produto.deleteMany();

    console.log("Produtos deletados:", resultado.count);
  } catch (error) {
    console.error("Erro ao deletar:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deletarTudo();