import express from "express";
import {
  criarProduto,
  listarMeusProdutos,
  listarTodosProdutos,
  atualizarEstoqueProduto,
} from "../controllers/produtoController.js";

const router = express.Router();

router.post("/criar", criarProduto);
router.get("/vendedor/:vendedorId", listarMeusProdutos); // Lista produtos de uma loja específica
router.get("/vitrine", listarTodosProdutos); // Lista tudo para o cliente comprar
router.patch("/estoque/:id", atualizarEstoqueProduto); // Atualiza estoque de um produto

export default router;
