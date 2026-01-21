import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const toggleFavorito = async (req, res) => {
  const { userId, produtoId } = req.body;

  try {
    const existing = await prisma.favorito.findUnique({
      where: {
        userId_produtoId: { userId, produtoId }
      }
    });

    if (existing) {
      await prisma.favorito.delete({
        where: { id: existing.id }
      });
      return res.status(200).json({ message: 'Removido dos favoritos', favoritado: false });
    } else {
      await prisma.favorito.create({
        data: { userId, produtoId }
      });
      return res.status(201).json({ message: 'Adicionado aos favoritos', favoritado: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar favorito', details: error.message });
  }
};

export const getFavoritos = async (req, res) => {
  const { userId } = req.params;

  try {
    const favoritos = await prisma.favorito.findMany({
      where: { userId },
      include: { produto: true }
    });
    res.status(200).json(favoritos.map(f => f.produto));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar favoritos', details: error.message });
  }
};