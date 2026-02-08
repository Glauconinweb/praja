import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Importação das rotas
import loginRoutes from "./routes/loginRoutes.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import lojaRoutes from "./routes/lojaRoutes.js";
import userActionsRoutes from "./routes/userActionsRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { buscarProdutos } from "./controllers/busca-inteligente/busca.js";
import {
  resetPassword,
  updatePassword,
} from "./controllers/resetPasswordController.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configurações básicas
app.use(cors()); // Libera o acesso para o app
app.use(express.json()); // Permite ler JSON no corpo da requisição

// --- ROTAS DA API ---
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.post("/api/reset-password", resetPassword);
app.post("/api/update-password", updatePassword);
app.use("/api/produtos", produtoRoutes);
app.use("/api/lojas", lojaRoutes);
app.use("/api/user", userActionsRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/chat", chatRoutes);
app.get("/api/busca", buscarProdutos);

// --- ROTA DE TESTE (RAIZ) ---
// Isso serve para você saber se o servidor está vivo acessando pelo navegador
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
  console.log(
    `Servidor rodando e aceitando conexões em http://0.0.0.0:${PORT}/`
  )
);