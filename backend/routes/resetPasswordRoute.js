import express from "express";
import { resetPassword } from "../controllers/resetPasswordController.js";

const router = express.Router();

router.post("/", resetPassword);

export default router;
