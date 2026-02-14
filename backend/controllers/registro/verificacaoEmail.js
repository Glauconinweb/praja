export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }

    // Bloqueia se o campo emailVerified for false
    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ error: "Verifique seu e-mail antes de fazer login." });
    }

    // Ajustado para user.senha (conforme seu schema)
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Extraímos os dados que você colocou no token durante o registro
    const { nome, email, senha, tipo } = decoded;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).send("Este e-mail já foi verificado!");
    }

    // Criando o usuário com os nomes exatos do seu SCHEMA
    await prisma.user.create({
      data: {
        nome: nome,
        email: email,
        senha: senha, // Já deve vir como hash do passo de registro
        tipo: tipo || "cliente",
        emailVerified: true,
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    console.error("[verifyEmail] Erro:", error);
    return res.status(400).send("Link inválido ou expirado.");
  }
};
