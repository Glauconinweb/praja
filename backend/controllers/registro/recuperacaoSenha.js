export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Busca o usuário usando o campo do seu schema
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Por segurança, alguns devs preferem dizer que o email foi enviado mesmo que não exista
      // mas aqui manteremos o erro 404 para facilitar seu teste no IFMA
      return res.status(404).json({ error: "E-mail não encontrado." });
    }

    // Criamos o token com o ID do usuário
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Suporte Prajá" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de Senha - Prajá",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Olá, ${user.nome}!</h2>
          <p>Você solicitou a recuperação de senha para sua conta no Prajá.</p>
          <p>Clique no botão abaixo para redefinir sua senha (válido por 1 hora):</p>
          <a href="${resetLink}" style="background-color: #ee3f0a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
          <p>Ou copie e cole o link: <br> ${resetLink}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
    });

    return res.json({ message: "E-mail de recuperação enviado com sucesso!" });
  } catch (error) {
    console.error("[forgotPassword] Erro:", error);
    return res.status(500).json({ error: "Erro ao enviar e-mail." });
  }
};
export const resetPassword = async (req, res) => {
  const { token, novaSenha } = req.body;

  try {
    // 1. Verifica se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Gera o hash da nova senha (importante!)
    const hash = await bcrypt.hash(novaSenha, 10);

    // 3. Atualiza no banco usando o ID que veio no token
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { senha: hash },
    });

    return res.json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("[resetPassword] Erro:", error);
    return res.status(400).json({ error: "Link inválido ou expirado." });
  }
};
