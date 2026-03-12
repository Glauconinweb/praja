import express from "express";
// Importe a função que criamos no controlador
import { registrarUsuario } from "../controllers/registro/registroUsuarios.js";

const router = express.Router();

// A rota recebe o POST e apenas repassa para o controlador
router.post("/teste", registrarUsuario);

export default router;
