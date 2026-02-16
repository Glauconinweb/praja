import express from 'express';
import { toggleFavorito, getFavoritos } from '../controllers/favoritoController.js';
import { registrarVisualizacao, getHistorico, limparHistorico } from '../controllers/historicoController.js';

const router = express.Router();

// Rotas de Favoritos
router.post('/favoritos/toggle', toggleFavorito);
router.get('/favoritos/:userId', getFavoritos);

// Rotas de Histórico
router.post('/historico/registrar', registrarVisualizacao);
router.get('/historico/:userId', getHistorico);
router.delete('/historico/:userId', limparHistorico);

export default router;
