/**
 * pixController.js
 *
 * Controller responsável pelo gerenciamento de chaves Pix de vendedores e entregadores.
 * Permite cadastrar, atualizar e consultar chaves Pix.
 *
 * Tipos de chave Pix suportados:
 *  - "cpf"       : CPF do titular (formato: 000.000.000-00 ou 00000000000)
 *  - "cnpj"      : CNPJ da empresa (formato: 00.000.000/0001-00 ou 00000000000100)
 *  - "email"     : E-mail cadastrado
 *  - "telefone"  : Telefone com DDD (formato: +5511999999999)
 *  - "aleatoria" : Chave aleatória gerada pelo banco
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
//  VALIDAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

function validarChavePix(tipo, chave) {
  switch (tipo) {
    case "cpf": {
      const cpf = chave.replace(/\D/g, "");
      return cpf.length === 11;
    }
    case "cnpj": {
      const cnpj = chave.replace(/\D/g, "");
      return cnpj.length === 14;
    }
    case "email": {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);
    }
    case "telefone": {
      const tel = chave.replace(/\D/g, "");
      return tel.length >= 10 && tel.length <= 13;
    }
    case "aleatoria": {
      // Chave aleatória tem formato UUID
      return chave.length >= 32 && chave.length <= 36;
    }
    default:
      return false;
  }
}

function formatarChavePix(tipo, chave) {
  switch (tipo) {
    case "cpf":
      return chave.replace(/\D/g, "");
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

// ─────────────────────────────────────────────────────────────────────────────
//  1. CADASTRAR / ATUALIZAR CHAVE PIX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/pix/chave/:userId
 *
 * Cadastra ou atualiza a chave Pix de um vendedor ou entregador.
 *
 * Body: {
 *   tipo: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria",
 *   chave: string
 * }
 */
export const cadastrarChavePix = async (req, res) => {
  const { userId } = req.params;
  const { tipo, chave } = req.body;

  if (!tipo || !chave) {
    return res.status(400).json({ error: "Campos obrigatórios: tipo, chave" });
  }

  const tiposValidos = ["cpf", "cnpj", "email", "telefone", "aleatoria"];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({
      error: `Tipo inválido. Use: ${tiposValidos.join(", ")}`,
    });
  }

  if (!validarChavePix(tipo, chave)) {
    return res.status(400).json({
      error: `Chave Pix inválida para o tipo "${tipo}"`,
    });
  }

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, tipo: true },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (!["vendedor", "entregador"].includes(usuario.tipo)) {
      return res.status(403).json({
        error: "Apenas vendedores e entregadores podem cadastrar chaves Pix",
      });
    }

    const chaveFormatada = formatarChavePix(tipo, chave);

    const usuarioAtualizado = await prisma.user.update({
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

    return res.status(200).json({
      message: "Chave Pix cadastrada com sucesso!",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao cadastrar chave Pix:", error);
    return res.status(500).json({ error: "Erro interno ao cadastrar chave Pix" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  2. BUSCAR CHAVE PIX DE UM USUÁRIO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/pix/chave/:userId
 *
 * Retorna a chave Pix de um vendedor ou entregador.
 * Qualquer usuário autenticado pode consultar a chave de um vendedor
 * (para realizar o pagamento).
 */
export const buscarChavePix = async (req, res) => {
  const { userId } = req.params;

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

    if (!usuario.chavePix) {
      return res.status(404).json({
        error: "Este usuário ainda não cadastrou uma chave Pix",
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
      });
    }

    return res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      tipo: usuario.tipo,
      chavePix: usuario.chavePix,
      tipoChavePix: usuario.tipoChavePix,
    });
  } catch (error) {
    console.error("Erro ao buscar chave Pix:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  3. REMOVER CHAVE PIX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/pix/chave/:userId
 * Remove a chave Pix de um vendedor ou entregador.
 */
export const removerChavePix = async (req, res) => {
  const { userId } = req.params;

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tipo: true, chavePix: true },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (!usuario.chavePix) {
      return res.status(400).json({ error: "Nenhuma chave Pix cadastrada" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { chavePix: null, tipoChavePix: null },
    });

    return res.status(200).json({ message: "Chave Pix removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover chave Pix:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};
