import nodemailer from "nodemailer";

export async function sendPasswordReset(email, token) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `http://localhost:5001/reset/${token}`;

  await transporter.sendMail({
    from: `"Suporte" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Redefinição de senha",
    html: `<p>Para redefinir sua senha, clique no link abaixo:</p>
           <a href="${resetLink}">${resetLink}</a>`,
  });
}
