import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM;
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Chat App";

if (!BREVO_API_KEY) {
    console.warn("Warning: BREVO_API_KEY is not set in .env. Mailer will fail until it is provided.");
}

/**
 * sendOtpEmail(toEmail, otp, options)
 * - toEmail: recipient email string
 * - otp: 6-digit code (string or number)
 * - options: { subject, ttlMinutes, textTemplate, htmlTemplate }
 */
export async function sendOtpEmail(toEmail, otp, options = {}) {
    if (!BREVO_API_KEY) throw new Error("Missing BREVO_API_KEY in environment");

    const subject = options.subject || "Your Chat App verification code";
    const ttlMinutes = options.ttlMinutes ?? 1;
    const textBody = options.textTemplate || `Your verification code is ${otp}. It expires in ${ttlMinutes} minute(s).`;
    const htmlBody =
        options.htmlTemplate ||
        `<p>Your verification code is <strong>${otp}</strong>.</p><p>This code will expire in ${ttlMinutes} minute(s).</p>`;

    const payload = {
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail }],
        subject,
        htmlContent: htmlBody,
        textContent: textBody
    };

    try {
        const resp = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
        headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json"
        },
        timeout: 10000
        });
        return resp.data;
    } catch (err) {
        // normalize error
        if (err.response) {
        const { status, data } = err.response;
        const e = new Error(`Brevo API error ${status}: ${JSON.stringify(data)}`);
        e.response = data;
        e.status = status;
        throw e;
        }
        throw err;
    }
}

export default { sendOtpEmail };