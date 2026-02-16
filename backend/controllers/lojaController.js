import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// 1. CRIAR LOJA (Registrar vendedor)
export async function criarLoja(req, res) {
  try {
    const { nome, email, senha, descricao, telefone, endereco, foto } = req.body;

    // Validação básica
    if (!nome || !email || !senha) {
      return res.status(400).json({
        message: "Preencha os campos obrigatórios (nome, email, senha).",
      });
    }

    // Verifica se o email já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({
        message: "Este email já está cadastrado.",
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria a loja (vendedor)
    const loja = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        tipo: "vendedor",
        descricao: descricao || null,
        telefone: telefone || null,
        endereco: endereco || null,
        foto: foto || null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        descricao: true,
        telefone: true,
        endereco: true,
        foto: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Loja criada com sucesso!",
      loja,
    });
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    return res.status(500).json({ message: "Erro interno ao criar loja." });
  }
}

// 2. LISTAR TODAS AS LOJAS
export async function listarLojas(req, res) {
  try {
    const lojas = await prisma.user.findMany({
      where: {
        tipo: "vendedor",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        descricao: true,
        telefone: true,
        endereco: true,
        foto: true,
        createdAt: true,
        _count: {
          select: { produtos: true },
        },
      },
    });

    return res.status(200).json(lojas);
  } catch (error) {
    console.error("Erro ao listar lojas:", error);
    return res.status(500).json({ message: "Erro ao buscar lojas." });
  }
}

// 3. BUSCAR LOJA POR ID
export async function buscarLojaPorId(req, res) {
  try {
    const { id } = req.params;

    const loja = await prisma.user.findUnique({
      where: {
        id: id,
        tipo: "vendedor",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        descricao: true,
        telefone: true,
        endereco: true,
        foto: true,
        createdAt: true,
        updatedAt: true,
        produtos: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            preco: true,
            quantidade: true,
            imagem: true,
            categoria: true,
            emEstoque: true,
          },
        },
      },
    });

    if (!loja) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }

    return res.status(200).json(loja);
  } catch (error) {
    console.error("Erro ao buscar loja:", error);
    return res.status(500).json({ message: "Erro ao buscar loja." });
  }
}

// 4. ATUALIZAR LOJA
export async function atualizarLoja(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao, telefone, endereco, foto } = req.body;

    // Verifica se a loja existe
    const lojaExistente = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!lojaExistente || lojaExistente.tipo !== "vendedor") {
      return res.status(404).json({ message: "Loja não encontrada." });
    }

    // Atualiza apenas os campos fornecidos
    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone;
    if (endereco !== undefined) dadosAtualizacao.endereco = endereco;
    if (foto !== undefined) dadosAtualizacao.foto = foto;

    const lojaAtualizada = await prisma.user.update({
      where: { id: id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        descricao: true,
        telefone: true,
        endereco: true,
        foto: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Loja atualizada com sucesso!",
      loja: lojaAtualizada,
    });
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar loja." });
  }
}

// 7. DELETAR PRODUTO
export async function deletarProduto(req, res) {
  try {
    const { id } = req.params;

    // Verifica se o produto existe
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    await prisma.produto.delete({ where: { id } });

    return res.status(200).json({ message: "Produto deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return res.status(500).json({ message: "Erro interno ao deletar produto." });
  }
}