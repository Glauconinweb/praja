import { PrismaClient } from "@prisma/client";
import { compararSenha } from "../../utils/bcrypt.js";
import { gerarToken } from "../../utils/jwt.js";

const prisma = new PrismaClient();

/**
 * @function loginGeral
 * @description Realiza o login unificado para Cliente, Vendedor ou Entregador
 */
export async function login(req, res) {
  const { email, senha } = req.body;

  try {
    // 1. Busca o usuário no MongoDB pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });

    // 2. Valida se o usuário existe
    if (!user) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    // 3. Valida a senha usando o campo 'senha' do seu schema
    const senhaValida = await compararSenha(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    // 4. (Opcional) Bloqueia login se o e-mail não estiver verificado
    /*if (!user.emailVerified) {
      return res.status(403).json({
        message:
          "Por favor, verifique seu e-mail antes de acessar a plataforma.",
      });
    }
\*/
    // 5. Gera o token JWT incluindo o tipo do usuário
    const token = gerarToken(user);

    // 6. Retorna os dados necessários para o seu app Expo (Dashboard)
    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo, // Retorna se é "vendedor", "cliente" ou "entregador"
      },
    });
  } catch (error) {
    console.error("Erro no processo de login:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
}
