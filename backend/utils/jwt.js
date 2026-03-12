import jwt from "jsonwebtoken";

export function gerarToken(user) {
  return jwt.sign({ id: user.id, tipo: user.tipo }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}
