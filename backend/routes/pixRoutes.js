import express from "express";
import {
  cadastrarChavePix,
  buscarChavePix,
  removerChavePix,
} from "../controllers/pixController.js";

const router = express.Router();

// Cadastrar ou atualizar chave Pix
router.put("/chave/:userId", cadastrarChavePix);

// Buscar chave Pix de um usuário
router.get("/chave/:userId", buscarChavePix);

// Remover chave Pix
router.delete("/chave/:userId", removerChavePix);

export default router;
