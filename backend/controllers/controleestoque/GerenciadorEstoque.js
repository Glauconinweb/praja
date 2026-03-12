import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GerenciadorEstoque = {
  /**
   * Atualiza a quantidade de um produto e seu status de disponibilidade.
   */
  async atualizarEstoque(produtoId, novaQuantidade) {
    try {
      // 1. Validação de ID e Quantidade para evitar erro 500 por 'undefined'
      if (!produtoId) {
        return { sucesso: false, mensagem: "ID do produto é obrigatório." };
      }

      const quantidade = Math.max(0, parseInt(novaQuantidade));

      if (isNaN(quantidade)) {
        return {
          sucesso: false,
          mensagem: "A quantidade informada não é um número válido.",
        };
      }

      const emEstoque = quantidade > 0;

      // 2. Operação no Prisma
      const produto = await prisma.produto.update({
        where: { id: produtoId },
        data: {
          quantidade: quantidade, // Garante que é um Int
          emEstoque: emEstoque,
        },
      });

      console.log(
        `[Estoque] Produto ${produtoId} atualizado para ${quantidade}`,
      );

      return {
        sucesso: true,
        produto,
        mensagem: emEstoque
          ? `Estoque atualizado: ${quantidade} unidades.`
          : `Produto esgotado e pausado automaticamente.`,
      };
    } catch (error) {
      // 3. Log detalhado para o seu terminal do VS Code
      console.error("--- ERRO NO PRISMA ---");
      console.error("Mensagem:", error.message);
      if (error.code === "P2025") {
        console.error("Causa: Produto não encontrado no banco.");
      }
      return {
        sucesso: false,
        mensagem: "Erro ao atualizar estoque no banco de dados.",
        error: error.message,
      };
    }
  },

  /**
   * Processa a venda de um produto, reduzindo o estoque.
   */
  async processarVenda(produtoId, quantidadeVendida) {
    try {
      const produto = await prisma.produto.findUnique({
        where: { id: produtoId },
      });

      if (!produto) {
        return { sucesso: false, mensagem: "Produto não encontrado." };
      }

      const qtdVenda = parseInt(quantidadeVendida);
      if (produto.quantidade < qtdVenda) {
        return {
          sucesso: false,
          mensagem: `Estoque insuficiente. Disponível: ${produto.quantidade}`,
        };
      }

      const novaQuantidade = produto.quantidade - qtdVenda;
      return await this.atualizarEstoque(produtoId, novaQuantidade);
    } catch (error) {
      console.error("Erro ao processar venda:", error);
      return { sucesso: false, mensagem: "Erro ao processar venda." };
    }
  },

  /**
   * Verifica se um produto está disponível.
   */
  async verificarDisponibilidade(produtoId) {
    try {
      const produto = await prisma.produto.findUnique({
        where: { id: produtoId },
        select: { emEstoque: true, quantidade: true },
      });
      return produto ? produto.emEstoque && produto.quantidade > 0 : false;
    } catch (error) {
      return false;
    }
  },
};

export default GerenciadorEstoque;
