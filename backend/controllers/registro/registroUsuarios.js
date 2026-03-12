import { PrismaClient } from "@prisma/client";
import { hashSenha } from "../../utils/bcrypt.js";
const prisma = new PrismaClient();

export const registrarUsuario = async (req, res) => {
  const { nome, email, senha, tipo } = req.body; // O 'tipo' vem direto do seu App

  try {
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ message: "Email já cadastrado" });

    const hash = await hashSenha(senha);

    // O Prisma salva o tipo que o usuário escolheu no App (cliente, vendedor ou entregador)
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email,
        senha: hash,
        tipo: tipo || "cliente", // Se não vier nada, assume cliente
      },
    });

    res.status(201).json({
      message: `${novoUsuario.tipo} cadastrado com sucesso!`,
      user: {
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        tipo: novoUsuario.tipo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao registrar usuário" });
  }
};
