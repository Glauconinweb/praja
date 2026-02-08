import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * SISTEMA DE BUSCA INTELIGENTE - BACKEND
 * 
 * Este arquivo contém a lógica de busca para produtos, integrando com o Prisma e MongoDB.
 */

// 1. BUSCAR PRODUTOS (Com filtros de nome e categoria)
export async function buscarProdutos(req, res) {
  try {
    const { q, categoria } = req.query;

    const where = {
      emEstoque: true,
    };

    // Filtro por termo de busca (nome ou descrição)
    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Filtro por categoria
    if (categoria && categoria !== 'Todos') {
      where.categoria = categoria;
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        vendedor: {
          select: {
            nome: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro na busca de produtos:", error);
    return res.status(500).json({ message: "Erro interno ao realizar busca." });
  }
}

// 2. LISTAR CATEGORIAS ÚNICAS
export async function listarCategorias(req, res) {
  try {
    // Busca todas as categorias distintas dos produtos em estoque
    const produtos = await prisma.produto.findMany({
      where: { emEstoque: true },
      select: { categoria: true },
      distinct: ['categoria']
    });

    const categorias = produtos.map(p => p.categoria);
    
    return res.status(200).json(['Todos', ...categorias]);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    return res.status(500).json({ message: "Erro ao buscar categorias." });
  }
}
