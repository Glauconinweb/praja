import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
/**
 * @function resetPassword
 * @description 
 * @param {object} req 
 * @param {object} res 
 */
export async function resetPassword(req, res) {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: "Se o usuário existir, um email de redefinição será enviado." });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `http://localhost:5001/reset.html?token=${token}`; 
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Redefinição de senha",
      html: `<p>Clique no link para redefinir sua senha:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });
    return res.status(200).json({ message: "Email de redefinição enviado!" });
  } catch (error) {
    console.error("Erro ao enviar email de redefinição:", error);
    return res.status(500).json({ message: "Erro interno ao enviar email" });
  }
}
/**
 * @function updatePassword
 * @description 
 * @param {object} req 
 * @param {object} res 
 */
export async function updatePassword(req, res) {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { senha: hash },
    });
    return res.status(200).json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}
