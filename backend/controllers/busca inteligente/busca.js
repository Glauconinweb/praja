import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * SISTEMA DE BUSCA INTELIGENTE - BACKEND (CORRIGIDO)
 */

// 1. BUSCAR PRODUTOS (Com filtros de nome e categoria)
export async function buscarProdutos(req, res) {
  try {
    const { q, categoria, subcategoria } = req.query;

    // 🔥 Ajuste: Tornamos o filtro de estoque opcional para testes
    // Se o produto existir mas emEstoque for null ou false, ele não apareceria.
    // Vamos buscar produtos que tenham quantidade > 0 OU emEstoque: true
    const where = {
      OR: [
        { emEstoque: true },
        { quantidade: { gt: 0 } }
      ]
    };

    // 🔎 Busca por texto (Nome ou Descrição)
    if (q && q.trim() !== "") {
      where.AND = [
        {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { descricao: { contains: q, mode: "insensitive" } },
          ]
        }
      ];
    }

    // 📦 Categoria (Padronizado com o Front-end: vestimentas, lanches, casa, eletronicos)
    if (categoria && categoria !== "Todos") {
      const catFormatada = categoria.toLowerCase().trim();
      
      // Mapeamento de segurança: se o front mandar "vestimentas" mas no banco estiver "roupas"
      if (catFormatada === "vestimentas") {
        where.categoria = { in: ["vestimentas", "roupas", "vestuário"] };
      } else if (catFormatada === "casa") {
        where.categoria = { in: ["casa", "móveis", "decoração"] };
      } else {
        where.categoria = catFormatada;
      }
    }

    // 🍰 SUBCATEGORIA
    if (subcategoria && subcategoria.trim() !== "") {
      where.subcategoria = subcategoria.toLowerCase().trim();
    }

    console.log("FILTRO DE BUSCA APLICADO:", JSON.stringify(where, null, 2));

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        loja: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro na busca de produtos:", error);
    return res.status(500).json({
      message: "Erro interno ao realizar busca.",
    });
  }
}

// 2. LISTAR CATEGORIAS ÚNICAS
export async function listarCategorias(req, res) {
  try {
    // Busca todas as categorias distintas dos produtos ativos
    const produtos = await prisma.produto.findMany({
      where: { 
        OR: [
          { emEstoque: true },
          { quantidade: { gt: 0 } }
        ]
      },
      select: { categoria: true },
      distinct: ['categoria']
    });

    const categoriasNoBanco = produtos.map(p => p.categoria).filter(Boolean);
    
    // Retorna "Todos" + as categorias que realmente existem no banco
    return res.status(200).json(['Todos', ...new Set(categoriasNoBanco)]);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    return res.status(500).json({ message: "Erro ao buscar categorias." });
  }
}