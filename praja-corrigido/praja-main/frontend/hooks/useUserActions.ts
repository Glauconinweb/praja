import { useState, useEffect } from 'react';
import { userActionsService } from '../services/useActions';

export const useUserActions = (userId?: string) => {
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavoritos = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await userActionsService.getFavoritos(userId);
    setFavoritos(data);
    setLoading(false);
  };

  const loadHistorico = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await userActionsService.getHistorico(userId);
    setHistorico(data);
    setLoading(false);
  };

  const toggleFavorito = async (produtoId: string) => {
    if (!userId) return;
    const result = await userActionsService.toggleFavorito(userId, produtoId);
    await loadFavoritos();
    return result;
  };

  const registrarVisualizacao = async (produtoId: string) => {
    if (!userId) return;
    await userActionsService.registrarVisualizacao(userId, produtoId);
    await loadHistorico();
  };

  useEffect(() => {
    if (userId) {
      loadFavoritos();
      loadHistorico();
    }
  }, [userId]);

  return {
    favoritos,
    historico,
    loading,
    toggleFavorito,
    registrarVisualizacao,
    refresh: () => { loadFavoritos(); loadHistorico(); }
  };
};