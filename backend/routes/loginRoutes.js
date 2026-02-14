import express from "express";
// Importamos apenas a função 'login' que é a única exportada no seu authController
import { login } from "../controllers/login/authController.js";

const router = express.Router();

// Agora todas as requisições de login podem bater no mesmo endpoint
// O próprio controlador decide quem é quem pelo 'tipo' no banco
router.post("/", login);

// Se você quiser manter rotas separadas no frontend, pode apontar todas para a mesma função:
router.post("/cliente", login);
router.post("/vendedor", login);
router.post("/entregador", login);

export default router;
