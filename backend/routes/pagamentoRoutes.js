import express from "express";
import {
  selecionarMetodoPagamento,
  confirmarEntregaComCodigo,
  buscarPagamentoPorPedido,
  buscarCodigoConfirmacao,
  listarTransacoesUsuario,
} from "../controllers/pagamentoController.js";
import { verificarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 todas protegidas
router.post("/selecionar-metodo", verificarToken, selecionarMetodoPagamento);
router.post("/confirmar-entrega", verificarToken, confirmarEntregaComCodigo);

// ❗ REMOVE clienteId da URL (inseguro)
router.get("/pedido/:pedidoId", verificarToken, buscarPagamentoPorPedido);
router.get("/codigo/:pedidoId", verificarToken, buscarCodigoConfirmacao);

// ❗ REMOVE userId da URL
router.get("/transacoes", verificarToken, listarTransacoesUsuario);

export default router;