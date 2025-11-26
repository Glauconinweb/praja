import express from "express";
import {
  criarProduto,
  listarMeusProdutos,
  listarTodosProdutos,
} from "../controllers/produtoController.js";

const router = express.Router();

router.post("/criar", criarProduto);
router.get("/vendedor/:vendedorId", listarMeusProdutos); // Lista produtos de uma loja específica
router.get("/vitrine", listarTodosProdutos); // Lista tudo para o cliente comprar

export default router;
