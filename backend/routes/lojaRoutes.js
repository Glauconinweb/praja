import express from "express";
import { verificarToken } from "../middleware/authMiddleware.js";

import {
  criarLoja,
  listarLojas,
  buscarLojaPorId,
  atualizarLoja,
  listarMinhasLojas,
} from "../controllers/lojaController.js";

const router = express.Router();

// 🔐 CRIAR LOJA
router.post("/", verificarToken, criarLoja);

// 📋 LISTAR TODAS
router.get("/", listarLojas);

// 👤 MINHAS LOJAS (ANTES DO :id)
router.get("/minhas", verificarToken, listarMinhasLojas);

// 🔍 BUSCAR POR ID
router.get("/:id", buscarLojaPorId);

// ✏️ ATUALIZAR
router.put("/:id", verificarToken, atualizarLoja);

export default router;