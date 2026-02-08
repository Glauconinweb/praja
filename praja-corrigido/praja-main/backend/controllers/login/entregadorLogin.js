import { PrismaClient } from "@prisma/client";
import { compararSenha } from "../../utils/bcrypt.js";
import { gerarToken } from "../../utils/jwt.js";

const prisma = new PrismaClient();
/**
 * @function loginEntregador
 * @description 
 * @param {object} req 
 * @param {object} res 
 */
export async function loginEntregador(req, res) {
  const { email, senha } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.tipo !== "entregador") {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }
    const senhaValida = await compararSenha(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }
    const token = gerarToken(user);
    return res.status(200).json({ 
      message: "Login realizado com sucesso!", 
      token: token,
      tipo: user.tipo
    });
  } catch (error) {
    console.error("Erro no login do entregador:", error);
    return res.status(500).json({ message: "Erro interno do servidor durante o login." });
  }
}
