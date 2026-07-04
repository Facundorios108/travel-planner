import nodemailer from "nodemailer";

/**
 * Creates a reusable Nodemailer transporter using Gmail + App Password.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD env vars.
 *
 * To generate an App Password:
 * 1. Go to https://myaccount.google.com/security
 * 2. Enable 2-Step Verification if not already enabled
 * 3. Go to "App passwords" → generate one for "Mail"
 * 4. Paste the 16-char password into GMAIL_APP_PASSWORD
 */
function createTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        throw new Error(
            "Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables. " +
            "See https://myaccount.google.com/apppasswords to generate one."
        );
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
}

interface SendMailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    const transporter = createTransporter();
    const from = `CatchMe <${process.env.GMAIL_USER}>`;

    await transporter.sendMail({ from, to, subject, html });
}
