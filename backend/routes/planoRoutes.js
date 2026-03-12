import express from "express";
import {
  listarPlanos,
  seedPlanos,
  assinarPlano,
  buscarPlanoVendedor,
} from "../controllers/planoController.js";

const router = express.Router();

// Listar todos os planos disponíveis
router.get("/", listarPlanos);

// Inicializar planos padrão no banco (executar apenas uma vez)
router.post("/seed", seedPlanos);

// Assinar um plano
router.post("/assinar", assinarPlano);

// Buscar plano atual de um vendedor
router.get("/vendedor/:vendedorId", buscarPlanoVendedor);

export default router;
