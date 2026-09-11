import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM =
  process.env.SMTP_FROM || "ContextDesk <no-reply@contextdesk.local>";

function smtpConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendVerificationCode(
  email: string,
  name: string,
  code: string
) {
  const subject = "Verify your ContextDesk account";
  const text = [
    `Hi ${name},`,
    ``,
    `Your ContextDesk verification code is: ${code}`,
    ``,
    `It expires in 15 minutes.`,
  ].join("\n");

  if (!smtpConfigured()) {
    console.log(
      `[mail:console] to=${email} subject="${subject}" code=${code}`
    );

    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject,
    text,
  });
}

export async function sendInvitation(
  email: string,
  organizationName: string,
  link: string
) {
  const subject = `You're invited to ${organizationName} on ContextDesk`;
  const text = [
    `You've been invited to join ${organizationName} on ContextDesk.`,
    ``,
    `Accept here: ${link}`,
    ``,
    `This invite expires in 7 days.`,
  ].join("\n");

  if (!smtpConfigured()) {
    console.log(
      `[mail:console] to=${email} subject="${subject}" link=${link}`
    );

    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject,
    text,
  });
}
