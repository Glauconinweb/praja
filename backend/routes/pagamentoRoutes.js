import express from "express";
import {
  selecionarMetodoPagamento,
  confirmarEntregaComCodigo,
  buscarPagamentoPorPedido,
  buscarCodigoConfirmacao,
  listarTransacoesUsuario,
} from "../controllers/pagamentoController.js";

const router = express.Router();

// Selecionar método de pagamento após fazer o pedido
router.post("/selecionar-metodo", selecionarMetodoPagamento);

// Confirmar entrega com código de 6 dígitos (usado pelo entregador)
router.post("/confirmar-entrega", confirmarEntregaComCodigo);

// Buscar detalhes do pagamento de um pedido
router.get("/pedido/:pedidoId", buscarPagamentoPorPedido);

// Buscar código de confirmação (apenas para o cliente do pedido)
router.get("/codigo/:pedidoId/:clienteId", buscarCodigoConfirmacao);

// Listar transações de um vendedor ou entregador
router.get("/transacoes/:userId", listarTransacoesUsuario);

export default router;
