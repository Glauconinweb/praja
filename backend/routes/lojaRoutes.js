import express from "express";
import { listarLojas } from "../controllers/lojaController.js";

const router = express.Router();

router.get("/", listarLojas);

export default router;
