import express from "express";
import {
  criarLoja,
  listarLojas,
  buscarLojaPorId,
  atualizarLoja,
} from "../controllers/lojaController.js";

const router = express.Router();

// Rotas de CRUD para lojas
router.post("/criar", criarLoja);           // Criar nova loja
router.get("/", listarLojas);               // Listar todas as lojas
router.get("/:id", buscarLojaPorId);        // Buscar loja por ID
router.put("/:id", atualizarLoja);          // Atualizar loja

export default router;
