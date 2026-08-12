import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export function setTransporter(t: Transporter) {
  transporter = t;
}

function defaultTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.163.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER ?? "", pass: process.env.SMTP_PASS ?? "" }
  });
}

export async function sendCode(email: string, code: string) {
  const t = transporter ?? defaultTransporter();
  await t.sendMail({
    from: process.env.SMTP_USER ?? "",
    to: email,
    subject: "【词汇量评估系统】验证码",
    text: `您的验证码是：${code}，5 分钟内有效。若非本人操作请忽略。`
  });
}
