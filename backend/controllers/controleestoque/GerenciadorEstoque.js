import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GERENCIADOR DE ESTOQUE - BACKEND
 *
 * Este módulo gerencia a lógica de estoque, integrando com o banco de dados MongoDB via Prisma.
 */

const GerenciadorEstoque = {
  /**
   * Atualiza a quantidade de um produto e seu status de disponibilidade.
   */
  async atualizarEstoque(produtoId, novaQuantidade) {
    try {
      const quantidade = Math.max(0, parseInt(novaQuantidade));
      const emEstoque = quantidade > 0;

      const produto = await prisma.produto.update({
        where: { id: produtoId },
        data: {
          quantidade,
          emEstoque,
        },
      });

      return {
        sucesso: true,
        produto,
        mensagem: emEstoque
          ? `Estoque atualizado: ${quantidade} unidades.`
          : `Produto esgotado e pausado automaticamente.`,
      };
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      return {
        sucesso: false,
        mensagem: "Erro ao atualizar estoque no banco de dados.",
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

      if (produto.quantidade < quantidadeVendida) {
        return {
          sucesso: false,
          mensagem: `Estoque insuficiente. Disponível: ${produto.quantidade}`,
        };
      }

      const novaQuantidade = produto.quantidade - quantidadeVendida;
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
