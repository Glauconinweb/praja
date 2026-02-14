import { PrismaClient } from "@prisma/client";
import { hashSenha } from "../../utils/bcrypt.js";
const prisma = new PrismaClient();

// Função genérica interna
const criarRegistro = (tipo) => async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ message: "Email já cadastrado" });

    const hash = await hashSenha(senha);
    await prisma.user.create({
      data: { nome, email, senha: hash, tipo },
    });

    res.json({ message: `${tipo} cadastrado com sucesso!` });
  } catch (error) {
    res.status(500).json({ message: "Erro ao registrar" });
  }
};

// Exporta as variações
export const registrarCliente = criarRegistro("cliente");
export const registrarEntregador = criarRegistro("entregador");
export const registrarVendedor = criarRegistro("vendedor");
