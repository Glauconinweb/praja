import { PrismaClient } from "@prisma/client";
import { hashSenha } from "../../utils/bcrypt.js";
const prisma = new PrismaClient();

export async function registrarCliente(req, res) {
  const { nome, email, senha } = req.body;

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) return res.status(400).json({ message: "Email já cadastrado" });

  const hash = await hashSenha(senha);
  await prisma.user.create({
    data: { nome, email, senha: hash, tipo: "cliente" },
  });

  res.json({ message: "Cliente cadastrado com sucesso!" });
}
