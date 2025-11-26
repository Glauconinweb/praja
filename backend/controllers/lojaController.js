import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lista apenas quem é VENDEDOR
export async function listarLojas(req, res) {
  try {
    const lojas = await prisma.user.findMany({
      where: {
        tipo: "vendedor", // O segredo está aqui
      },
      select: {
        id: true,
        nome: true,
        email: true,
        // Se você tiver campo de foto no futuro, adicione aqui
      },
    });

    return res.status(200).json(lojas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar lojas." });
  }
}
