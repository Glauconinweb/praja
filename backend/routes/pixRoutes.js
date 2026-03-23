import express from "express";
import {
  cadastrarChavePix,
  buscarChavePix,
  removerChavePix,
  buscarPixPorLoja,
} from "../controllers/pixController.js";
import { verificarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Cadastrar ou atualizar chave Pix (usuário logado)
router.put("/chave", verificarToken, cadastrarChavePix);

// 🔐 Buscar chave Pix do próprio usuário
router.get("/minha-chave", verificarToken, buscarChavePix);

// 🔐 Remover chave Pix
router.delete("/chave", verificarToken, removerChavePix);

// 🌐 Público - Cliente busca Pix da loja para pagar
router.get("/loja/:lojaId", buscarPixPorLoja);

export default router;