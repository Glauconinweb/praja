import express from "express";
import {
  criarProduto,
  listarMeusProdutos,
  listarTodosProdutos,
  buscarProdutoPorId,
  atualizarProduto,
  atualizarEstoqueProduto,
  deletarProduto,
} from "../controllers/produtoController.js";

const router = express.Router();

// Rotas de CRUD para produtos
router.post("/criar", criarProduto);                     // Criar produto
router.get("/vitrine", listarTodosProdutos);             // Listar todos produtos (vitrine)
router.get("/vendedor/:vendedorId", listarMeusProdutos); // Listar produtos de uma loja
router.get("/:id", buscarProdutoPorId);                  // Buscar produto por ID
router.put("/:id", atualizarProduto);                    // Atualizar produto completo
router.patch("/estoque/:id", atualizarEstoqueProduto);   // Atualizar apenas estoque
router.delete("/:id", deletarProduto);   

export default router;