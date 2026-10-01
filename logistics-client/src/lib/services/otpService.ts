import crypto from "crypto";
import nodemailer from "nodemailer";

export function generate6DigitOtp(): string {
  // Cryptographically strong random 6-digit number
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function verifyOtpHash(otp: string, storedHash: string): boolean {
  const incomingHash = hashOtp(otp);
  return incomingHash === storedHash;
}

export function getOtpExpiresAt(): Date {
  // 10 minutes expiry
  return new Date(Date.now() + 10 * 60 * 1000);
}

export async function sendOtpEmail({
  email,
  otp,
  stage,
  trackingId,
}: {
  email: string;
  otp: string;
  stage: "pickup" | "delivery";
  trackingId: string;
}): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";
  console.log(`\n======================================================`);
  console.log(`[OTP CONSOLE] Shipment: ${trackingId}`);
  console.log(`[OTP CONSOLE] Stage: ${stage.toUpperCase()} OTP`);
  console.log(`[OTP CONSOLE] Recipient: ${email}`);
  console.log(`[OTP CONSOLE] Code: >>> ${otp} <<< (Expires in 10 minutes)`);
  console.log(`======================================================\n`);

  if (process.env.EMAIL && process.env.PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS,
        },
      });

      await transporter.sendMail({
        from: `"Logistics Platform" <${process.env.EMAIL}>`,
        to: email,
        subject: `Your ${stage.toUpperCase()} OTP for Shipment ${trackingId}`,
        text: `Your verification code for ${stage} of shipment ${trackingId} is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2>Shipment Verification Code</h2>
            <p>Your OTP for <strong>${stage.toUpperCase()}</strong> of shipment <strong>${trackingId}</strong> is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; background: #f1f5f9; display: inline-block; border-radius: 8px;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 16px;">This OTP expires in 10 minutes.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[OTP Email Error] Failed to send email via SMTP:", (err as Error).message);
    }
  }
}
