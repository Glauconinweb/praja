import express from "express";
import {
  getOrCreateChat,
  enviarMensagem,
  listarMensagens,
  listarChatsAtivos,
  buscarChatPorId,
  marcarMensagensComoLidas,
} from "../controllers/chatController.js";
import { verificarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas as rotas de chat requerem autenticação
router.use(verificarToken);

// Criar ou buscar chat para um pedido
router.get("/pedido/:pedidoId", getOrCreateChat);

// Buscar um chat específico
router.get("/:chatId", buscarChatPorId);

// Enviar mensagem
router.post("/:chatId/mensagens", enviarMensagem);

// Listar mensagens de um chat
router.get("/:chatId/mensagens", listarMensagens);

// Listar chats ativos do usuário autenticado
router.get("/", listarChatsAtivos);

// Marcar mensagens como lidas
router.put("/:chatId/marcar-lidas", marcarMensagensComoLidas);

export default router;
