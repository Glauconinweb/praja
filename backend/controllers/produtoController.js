  import { PrismaClient } from "@prisma/client";
  import GerenciadorEstoque from "./controleestoque/GerenciadorEstoque.js";

  const prisma = new PrismaClient();

  // 1. CRIAR PRODUTO
  export async function criarProduto(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado." });
      }

      const {
        nome,
        descricao,
        preco,
        quantidade,
        imagem,
        categoria,
        subcategoria,
        lojaId,
      } = req.body;

      const categoriaFormatada = categoria?.toLowerCase().trim();
      const subcategoriaFormatada = subcategoria?.toLowerCase().trim();

      const categoriasValidas = {
        lanches: ["doces", "salgados", "bebidas"],
        roupas: ["camisa", "calção", "cueca", "calcinha"],
      };

      if (!categoriaFormatada || !categoriasValidas[categoriaFormatada]) {
        return res.status(400).json({
          message: "Categoria inválida",
        });
      }

      if (
        !subcategoriaFormatada ||
        !categoriasValidas[categoriaFormatada].includes(subcategoriaFormatada)
      ) {
        return res.status(400).json({
          message: "Subcategoria inválida para essa categoria",
        });
      }
      // ✅ Validação básica
      if (!nome || preco === undefined || !lojaId) {
        return res.status(400).json({
          message: "Nome, preço e loja são obrigatórios",
        });
      }

      // ✅ Validação de preço
      const precoConvertido = parseFloat(preco);

      if (isNaN(precoConvertido) || precoConvertido <= 0) {
        return res.status(400).json({
          message: "Preço inválido",
        });
      }

      // ✅ Validação de quantidade (NOVO)
      const qtd = quantidade !== undefined ? parseInt(quantidade) : 0;

      if (isNaN(qtd) || qtd < 0) {
        return res.status(400).json({
          message: "Quantidade inválida",
        });
      }

      // 🔍 Verifica loja
      const loja = await prisma.loja.findUnique({
        where: { id: lojaId },
      });

      if (!loja) {
        return res.status(404).json({
          message: "Loja não encontrada",
        });
      }

      // 🔐 Verifica dono
      if (loja.vendedorId !== req.user.id) {
        return res.status(403).json({
          message: "Sem permissão",
        });
      }

      // ✅ Criação do produto
      const produto = await prisma.produto.create({
        data: {
          nome,
          descricao,
          preco: precoConvertido, // 🔥 usando valor validado
          quantidade: qtd,
          imagem,
          categoria: categoriaFormatada,
          subcategoria: subcategoriaFormatada, // 🔥 NOVO
          lojaId,
          emEstoque: qtd > 0,
        },
      });

      return res.status(201).json(produto);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao criar produto" });
    }
  }

  // 2. LISTAR TODOS PRODUTOS
  export async function listarTodosProdutos(req, res) {
    try {
      const { categoria, subcategoria } = req.query;

      const filtros = {};

      if (categoria) {
        filtros.categoria = categoria.toLowerCase().trim();
      }

      if (subcategoria) {
        filtros.subcategoria = subcategoria.toLowerCase().trim();
      }

      const produtos = await prisma.produto.findMany({
        where: filtros,
        orderBy: { createdAt: "desc" },
      });

      res.json(produtos);
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      res.status(500).json({ message: "Erro ao listar produtos" });
    }
  }

  // 3. BUSCAR PRODUTO POR ID
  export async function buscarProdutoPorId(req, res) {
    try {
      const { id } = req.params;

      const produto = await prisma.produto.findUnique({
        where: { id },
        include: {
          loja: {
            select: {
              id: true,
              nome: true,
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

  // 4. ATUALIZAR PRODUTO
  export async function atualizarProduto(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado." });
      }

      const { id } = req.params;
      const {
        nome,
        descricao,
        preco,
        quantidade,
        imagem,
        categoria,
        subcategoria,
      } = req.body;

      const dadosAtualizacao = {};

      if (subcategoria !== undefined) {
        dadosAtualizacao.subcategoria =
          subcategoria && subcategoria.trim() !== ""
            ? subcategoria.toLowerCase().trim()
            : null;
      }


      const produtoExistente = await prisma.produto.findUnique({
        where: { id },
        include: { loja: true },
      });

      if (!produtoExistente) {
        return res.status(404).json({ message: "Produto não encontrado." });
      }

      if (produtoExistente.loja.vendedorId !== req.user.id) {
        return res.status(403).json({
          message: "Sem permissão",
        });
      }


      if (nome !== undefined) dadosAtualizacao.nome = nome;

      if (descricao !== undefined)
        dadosAtualizacao.descricao = descricao;

      if (preco !== undefined) {
        const p = parseFloat(preco);
        if (!isNaN(p)) dadosAtualizacao.preco = p;
      }

      if (quantidade !== undefined) {
        const qtd = parseInt(quantidade);
        if (!isNaN(qtd)) {
          dadosAtualizacao.quantidade = qtd;
          dadosAtualizacao.emEstoque = qtd > 0;
        }
      }

      if (imagem !== undefined) dadosAtualizacao.imagem = imagem;

      // 🔥 CORREÇÃO DEFINITIVA
      if (categoria !== undefined) {
        dadosAtualizacao.categoria =
          categoria && categoria.trim() !== ""
            ? categoria.toLowerCase().trim()
            : "geral";
      }

      console.log("DADOS ATUALIZAÇÃO:", dadosAtualizacao);

      const produtoAtualizado = await prisma.produto.update({
        where: { id },
        data: dadosAtualizacao,
      });

      return res.status(200).json(produtoAtualizado);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      return res.status(500).json({
        message: "Erro interno ao atualizar produto.",
      });
    }
  }

  // 5. ESTOQUE
  export async function atualizarEstoqueProduto(req, res) {
    try {
      const { id } = req.params;
      const { quantidade } = req.body;

      const resultado = await GerenciadorEstoque.atualizarEstoque(
        id,
        quantidade
      );

      return resultado.sucesso
        ? res.status(200).json(resultado)
        : res.status(400).json(resultado);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      return res.status(500).json({
        message: "Erro interno ao atualizar estoque.",
      });
    }
  }

  // 6. PRODUTOS POR LOJA
  export async function listarProdutosPorLoja(req, res) {
    try {
      const { id } = req.params;

      const categoriasValidas = ["lanches", "roupas"];

      const produtos = await prisma.produto.findMany({
        where: {
          lojaId: id, // ✅ CORRETO

          categoria: {
            in: categoriasValidas,
          },
        },
      });

      return res.status(200).json(produtos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erro ao buscar produtos da loja",
      });
    }
  }
  // 7. DELETAR
  export async function deletarProduto(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Não autenticado." });
      }

      const id = req.params.id;

      const produto = await prisma.produto.findUnique({
        where: { id },
        select: {
          id: true,
          loja: {
            select: {
              vendedorId: true,
            },
          },
        },
      });

      if (!produto) {
        return res.status(404).json({
          message: "Produto não encontrado",
        });
      }

      if (produto.loja.vendedorId !== req.user.id) {
        return res.status(403).json({
          message: "Sem permissão",
        });
      }

      await prisma.produto.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Produto deletado com sucesso",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erro ao deletar produto",
      });
    }
  }
