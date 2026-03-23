import express from "express";
import {
  criarPedido,
  atualizarStatusPedido,
  listarPedidosUsuario,
  buscarPedidoPorId,
  listarPedidosDisponiveis,
  aceitarPedido,
} from "../controllers/pedidoController.js";
import { verificarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/criar", verificarToken, criarPedido);
router.put("/:id/status", verificarToken, atualizarStatusPedido);
router.put("/:id/aceitar", verificarToken, aceitarPedido);
router.get("/meus", verificarToken, listarPedidosUsuario);
router.get("/disponiveis",verificarToken, listarPedidosDisponiveis);
router.get("/:id", verificarToken, buscarPedidoPorId);

export default router;
