import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. CRIAR LOJA
export async function criarLoja(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    const { nome, descricao, telefone, endereco, foto } = req.body;
    const vendedorId = req.user.id;

    // Verifica se é vendedor
    const usuario = await prisma.user.findUnique({
      where: { id: vendedorId },
    });

    if (!usuario || usuario.tipo !== "vendedor") {
      return res.status(403).json({
        message: "Apenas vendedores podem criar lojas.",
      });
    }

    if (!nome) {
      return res.status(400).json({
        message: "Nome da loja é obrigatório.",
      });
    }

    const quantidadeLojas = await prisma.loja.count({
      where: {
        vendedorId,
      },
    });

    if (quantidadeLojas >= 20) {
      return res.status(403).json({
        message: "Você atingiu o limite máximo de 20 lojas.",
      });
    }

    const novaLoja = await prisma.loja.create({
      data: {
        nome,
        descricao,
        telefone,
        endereco,
        foto,
        vendedorId,
      },
    });

    return res.status(201).json({
      message: "Loja criada com sucesso!",
      loja: novaLoja,
    });
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    return res.status(500).json({ message: "Erro interno ao criar loja." });
  }
}

// 2. LISTAR TODAS AS LOJAS
export async function listarLojas(req, res) {
  try {
    const lojas = await prisma.loja.findMany({
      include: {
        vendedor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
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

// 3. LISTAR MINHAS LOJAS
export async function listarMinhasLojas(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    if (req.user.tipo !== "vendedor") {
      return res.status(403).json({
        message: "Apenas vendedores têm lojas.",
      });
    }

    const vendedorId = req.user.id;

    const lojas = await prisma.loja.findMany({
      where: {
        vendedorId,
      },
    });

    return res.status(200).json(lojas);
  } catch (error) {
    console.error("Erro ao listar lojas do vendedor:", error);
    return res.status(500).json({ message: "Erro ao buscar lojas." });
  }
}

// 4. ATUALIZAR LOJA
export async function atualizarLoja(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    const { id } = req.params;
    const { nome, descricao, telefone, endereco, foto } = req.body;

    const lojaExistente = await prisma.loja.findUnique({
      where: { id },
    });

    if (!lojaExistente) {
      return res.status(404).json({ message: "Loja não encontrada." });
    }

    // 🔐 Verifica se é dono da loja
    if (lojaExistente.vendedorId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para alterar esta loja.",
      });
    }

    const dadosAtualizacao = {};

    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone;
    if (endereco !== undefined) dadosAtualizacao.endereco = endereco;
    if (foto !== undefined) dadosAtualizacao.foto = foto;

    const lojaAtualizada = await prisma.loja.update({
      where: { id },
      data: dadosAtualizacao,
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

// 5. BUSCAR LOJA POR ID
export async function buscarLojaPorId(req, res) {
  try {
    const { id } = req.params;

    const loja = await prisma.loja.findUnique({
      where: { id },
      include: {
        produtos: {
          take: 20,
          skip: 0
        },
        vendedor: {
          select: { id: true, nome: true, email: true },
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

// 6. BUSCAR PRODUTOS POR LOJA
export async function buscarProdutosPorLoja(req, res) {
  try {
    const { id } = req.params;

    const loja = await prisma.loja.findUnique({
      where: { id },
      include: {
        produtos: true
      }
    });

    if (!loja) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    return res.status(200).json(loja.produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({
      message: "Erro ao buscar produtos da loja",
    });
  }
}

export async function deletarLoja(req, res) {
  try {
    const { id } = req.params;

    const loja = await prisma.loja.findUnique({
      where: { id },
    });

    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    if (!loja) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    if (loja.vendedorId !== req.user.id) {
      return res.status(403).json({
        message: "Sem permissão",
      });
    }

    await prisma.loja.delete({
      where: { id },
    });

    return res.json({ message: "Loja deletada com sucesso" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao deletar loja" });
  }
}