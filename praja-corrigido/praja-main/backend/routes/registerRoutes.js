import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route 
 * @description 
 */
router.post("/", async (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário já cadastrado!" });
    }
    const hash = await bcrypt.hash(senha, 10);
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senha: hash,
        tipo,
      },
    });
    return res.status(201).json({ message: "Usuário cadastrado com sucesso!", user });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ message: "Erro interno ao cadastrar usuário" });
  }
});
export default router;