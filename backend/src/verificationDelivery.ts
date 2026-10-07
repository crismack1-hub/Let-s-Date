import nodemailer from "nodemailer";

export type VerificationMethod = "email" | "phone";

export async function sendVerificationCode(
  method: VerificationMethod,
  destination: string,
  code: string,
): Promise<void> {
  if (method === "email") {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;
    if (!host || !user || !pass || !from) {
      throw new Error("Email verification is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.");
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: destination,
      subject: "Your Connect verification code",
      text: `Your Connect verification code is ${code}. It expires in 10 minutes.`,
    });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error("Phone verification is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.");
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: destination,
        From: from,
        Body: `Your Connect verification code is ${code}. It expires in 10 minutes.`,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`SMS delivery failed with status ${response.status}.`);
  }
}
