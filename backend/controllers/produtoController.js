import { PrismaClient } from "@prisma/client";
import GerenciadorEstoque from "./controleestoque/GerenciadorEstoque.js";

const prisma = new PrismaClient();

// 1. CRIAR PRODUTO
export async function criarProduto(req, res) {
  try {
    const {
      nome,
      descricao,
      preco,
      quantidade,
      imagem,
      categoria,
      vendedorId,
    } = req.body;

    // Validação básica
    if (!nome || !preco || !vendedorId) {
      return res
        .status(400)
        .json({
          message: "Preencha os campos obrigatórios (nome, preço, vendedor).",
        });
    }

    // Verifica se o vendedor existe
    const vendedor = await prisma.user.findUnique({
      where: { id: vendedorId },
    });
    if (!vendedor)
      return res.status(404).json({ message: "Vendedor não encontrado." });

    const qtdInicial = parseInt(quantidade);
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        quantidade: qtdInicial,
        imagem,
        categoria,
        vendedorId,
        emEstoque: qtdInicial > 0,
      },
    });

    return res
      .status(201)
      .json({ message: "Produto criado com sucesso!", produto });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return res.status(500).json({ message: "Erro interno ao criar produto." });
  }
}

// 2. LISTAR PRODUTOS DE UM VENDEDOR
export async function listarMeusProdutos(req, res) {
  const { vendedorId } = req.params;

  try {
    const produtos = await prisma.produto.findMany({
      where: { vendedorId: vendedorId },
    });
    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar produtos." });
  }
}

// 3. LISTAR TODOS (Para a Dashboard do Cliente)
export async function listarTodosProdutos(req, res) {
  try {
    const produtos = await prisma.produto.findMany({
      where: { emEstoque: true },
      include: { vendedor: { select: { nome: true } } }, // Traz o nome da loja junto
    });
    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar vitrine." });
  }
}

// 4. ATUALIZAR ESTOQUE (Usando o Gerenciador de Estoque)
export async function atualizarEstoqueProduto(req, res) {
  const { id } = req.params;
  const { quantidade } = req.body;

  try {
    const resultado = await GerenciadorEstoque.atualizarEstoque(id, quantidade);
    
    if (resultado.sucesso) {
      return res.status(200).json(resultado);
    } else {
      return res.status(400).json(resultado);
    }
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar estoque." });
  }
}
