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

    const qtdInicial = parseInt(quantidade) || 0;
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: parseFloat(preco),
        quantidade: qtdInicial,
        imagem: imagem || null,
        categoria: categoria || "Geral",
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
      include: {
        vendedor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });
    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ message: "Erro ao buscar produtos." });
  }
}

// 3. LISTAR TODOS (Para a Dashboard do Cliente)
export async function listarTodosProdutos(req, res) {
  try {
    const produtos = await prisma.produto.findMany({
      where: { emEstoque: true },
      include: { vendedor: { select: { nome: true, foto: true } } }, // Traz o nome da loja junto
    });
    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar vitrine:", error);
    return res.status(500).json({ message: "Erro ao buscar vitrine." });
  }
}

// 4. BUSCAR PRODUTO POR ID
export async function buscarProdutoPorId(req, res) {
  try {
    const { id } = req.params;

    const produto = await prisma.produto.findUnique({
      where: { id: id },
      include: {
        vendedor: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            endereco: true,
            foto: true,
          },
        },
      },
    });

    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    return res.status(200).json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ message: "Erro ao buscar produto." });
  }
}

// 5. ATUALIZAR PRODUTO COMPLETO
export async function atualizarProduto(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, quantidade, imagem, categoria } = req.body;

    // Verifica se o produto existe
    const produtoExistente = await prisma.produto.findUnique({
      where: { id: id },
    });

    if (!produtoExistente) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    // Prepara os dados para atualização
    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (preco !== undefined) dadosAtualizacao.preco = parseFloat(preco);
    if (quantidade !== undefined) {
      const qtd = parseInt(quantidade);
      dadosAtualizacao.quantidade = qtd;
      dadosAtualizacao.emEstoque = qtd > 0;
    }
    if (imagem !== undefined) dadosAtualizacao.imagem = imagem;
    if (categoria !== undefined) dadosAtualizacao.categoria = categoria;

    const produtoAtualizado = await prisma.produto.update({
      where: { id: id },
      data: dadosAtualizacao,
    });

    return res.status(200).json({
      message: "Produto atualizado com sucesso!",
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar produto." });
  }
}

// 6. ATUALIZAR ESTOQUE (Usando o Gerenciador de Estoque)
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
