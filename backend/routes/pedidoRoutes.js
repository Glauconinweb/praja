import express from "express";
import {
  criarPedido,
  atualizarStatusPedido,
  listarPedidosUsuario
} from "../controllers/pedidoController.js";

const router = express.Router();

router.post("/criar", criarPedido);
router.put("/:id/status", atualizarStatusPedido);
router.get("/usuario/:userId", listarPedidosUsuario);

export default router;
