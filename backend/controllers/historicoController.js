import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registrarVisualizacao = async (req, res) => {
  const { userId, produtoId } = req.body;

  try {
    // Opcional: Limitar o histórico para não crescer infinitamente por usuário
    await prisma.historico.create({
      data: { userId, produtoId }
    });
    res.status(201).json({ message: 'Visualização registrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar histórico', details: error.message });
  }
};

export const getHistorico = async (req, res) => {
  const { userId } = req.params;

  try {
    const historico = await prisma.historico.findMany({
      where: { userId },
      include: { produto: true },
      orderBy: { vistoEm: 'desc' },
      take: 20 // Retorna as últimas 20 visualizações
    });
    
    // Remover duplicatas mantendo a mais recente
    const uniqueProducts = [];
    const seenIds = new Set();
    
    for (const item of historico) {
      if (!seenIds.has(item.produtoId)) {
        seenIds.add(item.produtoId);
        uniqueProducts.push(item.produto);
      }
    }

    res.status(200).json(uniqueProducts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico', details: error.message });
  }
};

export const limparHistorico = async (req, res) => {
  const { userId } = req.params;

  try {
    await prisma.historico.deleteMany({
      where: { userId }
    });
    res.status(200).json({ message: 'Histórico limpo' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar histórico', details: error.message });
  }
};