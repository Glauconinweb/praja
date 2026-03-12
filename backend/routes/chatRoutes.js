import express from "express";
import {
  getOrCreateChat,
  enviarMensagem,
  listarMensagens,
  listarChatsAtivos
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/pedido/:pedidoId", getOrCreateChat);
router.post("/:chatId/mensagens", enviarMensagem);
router.get("/:chatId/mensagens", listarMensagens);
router.get("/usuario/:userId", listarChatsAtivos);

export default router;
