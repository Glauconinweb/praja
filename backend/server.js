import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";


import loginRoutes from "./routes/loginRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import { resetPassword, updatePassword } from "./controllers/resetPasswordController.js";
dotenv.config();

const app = express();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.post("/api/reset-password", resetPassword);
app.post("/api/update-password", updatePassword);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

/**
 * @function connectDB
 * @description 
 */
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
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}/`)
);
