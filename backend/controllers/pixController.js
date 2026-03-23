import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// VALIDAÇÕES
// ─────────────────────────────────────────────

function validarChavePix(tipo, chave) {
  switch (tipo) {
    case "cpf":
      return chave.replace(/\D/g, "").length === 11;

    case "cnpj":
      return chave.replace(/\D/g, "").length === 14;

    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);

    case "telefone": {
      const tel = chave.replace(/\D/g, "");
      return tel.length >= 10 && tel.length <= 13;
    }

    case "aleatoria":
      return chave.length >= 32 && chave.length <= 36;

    default:
      return false;
  }
}

function formatarChavePix(tipo, chave) {
  switch (tipo) {
    case "cpf":
    case "cnpj":
      return chave.replace(/\D/g, "");

    case "telefone": {
      const tel = chave.replace(/\D/g, "");
      return tel.startsWith("55") ? `+${tel}` : `+55${tel}`;
    }

    default:
      return chave.trim();
  }
}

// ─────────────────────────────────────────────
// 1. CADASTRAR / ATUALIZAR CHAVE PIX
// ─────────────────────────────────────────────

export const cadastrarChavePix = async (req, res) => {
  const userId = req.user.id;
  const { tipo, chave } = req.body;

  if (!tipo || !chave) {
    return res.status(400).json({ error: "tipo e chave são obrigatórios" });
  }

  const tiposValidos = ["cpf", "cnpj", "email", "telefone", "aleatoria"];

  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({
      error: `Tipo inválido. Use: ${tiposValidos.join(", ")}`,
    });
  }

  if (!validarChavePix(tipo, chave)) {
    return res.status(400).json({
      error: "Chave Pix inválida",
    });
  }

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tipo: true },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const temLoja = await prisma.loja.findFirst({
      where: { vendedorId: userId },
    });

    if (!temLoja && usuario.tipo !== "entregador") {
      return res.status(403).json({
        error: "Apenas vendedores ou entregadores podem cadastrar Pix",
      });
    }

    const chaveFormatada = formatarChavePix(tipo, chave);

    const atualizado = await prisma.user.update({
      where: { id: userId },
      data: {
        chavePix: chaveFormatada,
        tipoChavePix: tipo,
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        chavePix: true,
        tipoChavePix: true,
      },
    });

    return res.json({
      message: "Chave Pix salva com sucesso",
      usuario: atualizado,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ─────────────────────────────────────────────
// 2. BUSCAR MINHA CHAVE PIX
// ─────────────────────────────────────────────

export const buscarChavePix = async (req, res) => {
  const userId = req.user.id;

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        tipo: true,
        chavePix: true,
        tipoChavePix: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json(usuario);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ─────────────────────────────────────────────
// 3. REMOVER CHAVE PIX
// ─────────────────────────────────────────────

export const removerChavePix = async (req, res) => {
  const userId = req.user.id;

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario || !usuario.chavePix) {
      return res.status(400).json({
        error: "Nenhuma chave Pix cadastrada",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        chavePix: null,
        tipoChavePix: null,
      },
    });

    return res.json({
      message: "Chave Pix removida",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ─────────────────────────────────────────────
// 4. BUSCAR PIX DA LOJA (CHECKOUT)
// ─────────────────────────────────────────────

export const buscarPixPorLoja = async (req, res) => {
  const { lojaId } = req.params;

  try {
    const loja = await prisma.loja.findUnique({
      where: { id: lojaId },
      include: {
        vendedor: {
          select: {
            id: true,
            nome: true,
            chavePix: true,
            tipoChavePix: true,
          },
        },
      },
    });

    if (!loja) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    if (!loja.vendedor?.chavePix) {
      return res.status(404).json({
        error: "Loja sem Pix cadastrado",
      });
    }

    return res.json({
      lojaId: loja.id,
      lojaNome: loja.nome,
      recebedor: {
        nome: loja.vendedor.nome,
        chave: loja.vendedor.chavePix,
        tipo: loja.vendedor.tipoChavePix,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno" });
  }
};