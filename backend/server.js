import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Importação das rotas existentes
import loginRoutes from "./routes/loginRoutes.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import lojaRoutes from "./routes/lojaRoutes.js";
import userActionsRoutes from "./routes/userActionsRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Importação das novas rotas de pagamento, planos e Pix
import pagamentoRoutes from "./routes/pagamentoRoutes.js";
import planoRoutes from "./routes/planoRoutes.js";
import pixRoutes from "./routes/pixRoutes.js";

import { buscarProdutos } from "./controllers/busca inteligente/busca.js";
import { resetPassword, updatePassword } from "./controllers/resetPasswordController.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configurações básicas
app.use(cors());
app.use(express.json());

// --- ROTAS DA API (existentes) ---
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.post("/api/reset-password", resetPassword);
app.post("/api/update-password", updatePassword);
app.use("/api/produtos", produtoRoutes);
app.use("/api/user", userActionsRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/lojas", lojaRoutes);
app.get("/api/busca", buscarProdutos);

// --- NOVAS ROTAS DE PAGAMENTO, PLANOS E PIX ---
app.use("/api/pagamentos", pagamentoRoutes);
app.use("/api/planos", planoRoutes);
app.use("/api/pix", pixRoutes);

// --- ROTA DE TESTE (RAIZ) ---
app.get("/", (req, res) => {
  res.send("API do Prajá está funcionando! 🚀");
});

// Conexão com o Banco de Dados
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Conectado ao MongoDB Atlas com Prisma!");
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
    process.exit(1);
  }
}
connectDB();

// Inicialização do Servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor rodando e aceitando conexões em http://0.0.0.0:${PORT}/`)
);
