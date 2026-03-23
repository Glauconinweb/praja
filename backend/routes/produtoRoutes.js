import express from "express";
import { verificarToken } from "../middleware/authMiddleware.js";

import {
  criarProduto,
  listarTodosProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  atualizarEstoqueProduto,
  listarProdutosPorLoja,
  deletarProduto,
} from "../controllers/produtoController.js";

const router = express.Router();

// 🔐 CRIAR PRODUTO (protegido)
router.post("/", verificarToken, criarProduto);

// 🛍️ VITRINE (público)
router.get("/vitrine", listarTodosProdutos);

// 📦 PRODUTOS DE UMA LOJA (IMPORTANTE: antes do :id)
router.get("/loja/:id", listarProdutosPorLoja);

// 🔍 BUSCAR PRODUTO POR ID
router.get("/:id", buscarProdutoPorId);

// ✏️ ATUALIZAR PRODUTO
router.put("/:id", verificarToken, atualizarProduto);

// 📦 ATUALIZAR ESTOQUE
router.patch("/estoque/:id", verificarToken, atualizarEstoqueProduto);

// 🗑️ DELETAR PRODUTO
router.delete("/:id", verificarToken, deletarProduto);



export default router;