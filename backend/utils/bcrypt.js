import bcrypt from "bcrypt";

export async function hashSenha(senha) {
  return await bcrypt.hash(senha, 10);
}

export async function compararSenha(senha, hash) {
  return await bcrypt.compare(senha, hash);
}
