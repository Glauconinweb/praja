import express from "express";
import { loginCliente } from "../controllers/login/clienteLogin.js";
import { loginVendedor } from "../controllers/login/vendedorLogin.js";
import { loginEntregador } from "../controllers/login/entregadorLogin.js";

const router = express.Router();

router.post("/cliente", loginCliente);
router.post("/vendedor", loginVendedor);
router.post("/entregador", loginEntregador);

export default router;
