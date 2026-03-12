import express from "express";
import {
  criarPedido,
  atualizarStatusPedido,
  listarPedidosUsuario,
  buscarPedidoPorId,
  listarPedidosDisponiveis,
  aceitarPedido,
} from "../controllers/pedidoController.js";

const router = express.Router();

router.post("/criar", criarPedido);
router.put("/:id/status", atualizarStatusPedido);
router.put("/:id/aceitar", aceitarPedido);
router.get("/usuario/:userId", listarPedidosUsuario);
router.get("/disponiveis", listarPedidosDisponiveis);
router.get("/:id", buscarPedidoPorId);

export default router;
