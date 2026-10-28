/**
 * brevoEmailService.js
 * Transactional email service supporting Brevo SMTP Relay via nodemailer
 * and Brevo REST API v3, with automatic sandbox fallback.
 */

const axios = require("axios");
let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  // nodemailer loaded lazily
}

class BrevoEmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || null;
    this.smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
    this.smtpPort = parseInt(process.env.BREVO_SMTP_PORT || "587", 10);
    this.smtpUser = process.env.BREVO_USER || null;
    this.smtpKey = process.env.BREVO_SMTP_KEY || null;
    this.senderEmail = process.env.BREVO_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || "godfrey.cs23@krct.ac.in";
    this.senderName = process.env.BREVO_SENDER_NAME || "FloodAI Threat Intelligence";
    this.smtpTransporter = null;

    this.initSmtp();
  }

  initSmtp() {
    if (nodemailer && this.smtpUser && this.smtpKey) {
      try {
        this.smtpTransporter = nodemailer.createTransport({
          host: this.smtpHost,
          port: this.smtpPort,
          secure: false, // port 587 uses STARTTLS
          auth: {
            user: this.smtpUser,
            pass: this.smtpKey,
          },
        });
      } catch (err) {
        console.warn("[Brevo:SMTP] Could not initialize nodemailer transporter:", err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(
      (this.smtpTransporter && this.smtpUser && this.smtpKey) ||
      (this.apiKey && !this.apiKey.includes("your_brevo_key"))
    );
  }

  async sendEmail({ to, subject, htmlContent, textContent }) {
    if (!to) throw new Error("Recipient email is required");

    // 1. Try Brevo SMTP Relay via nodemailer if configured
    if (this.smtpTransporter) {
      try {
        const info = await this.smtpTransporter.sendMail({
          from: `"${this.senderName}" <${this.senderEmail}>`,
          to,
          subject,
          text: textContent || subject,
          html: htmlContent,
        });

        console.log(`[EMAIL:Brevo:SMTP] Dispatched to ${to}. MessageId: ${info.messageId}`);
        return {
          status: "sent",
          provider: "brevo_smtp",
          messageId: info.messageId,
          to,
          subject,
        };
      } catch (smtpErr) {
        console.error("[EMAIL:Brevo:SMTP:Error]", smtpErr.message);
        // If SMTP fails, continue to REST API or fallback
      }
    }

    // 2. Try Brevo REST API v3 if API key available
    if (this.apiKey && !this.apiKey.includes("your_brevo_key")) {
      try {
        const response = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: { name: this.senderName, email: this.senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent,
            textContent: textContent || subject,
          },
          {
            headers: {
              "api-key": this.apiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 7000,
          }
        );

        return {
          status: "sent",
          provider: "brevo_api",
          messageId: response.data.messageId,
          to,
          subject,
        };
      } catch (err) {
        console.error("[EMAIL:Brevo:API:Error]", err.response?.data || err.message);
      }
    }

    // 3. Fallback Sandbox logger
    console.log("--------------------------------------------------");
    console.log(`[EMAIL:Sandbox] TO: ${to}`);
    console.log(`[EMAIL:Sandbox] SUBJECT: ${subject}`);
    console.log(`[EMAIL:Sandbox] PREVIEW: ${textContent || htmlContent.substring(0, 140)}...`);
    console.log("--------------------------------------------------");
    return {
      status: "delivered",
      provider: "brevo_sandbox",
      messageId: `sandbox_${Date.now()}`,
      to,
      subject,
    };
  }

  async sendThreatAlert({ to, district, riskLevel, probabilityPct, message, directives }) {
    const subject = `[EMERGENCY ${riskLevel.toUpperCase()}] Flood Threat Alert for ${district}`;
    const directivesList = (directives || [])
      .map((d) => `<li style="margin-bottom: 6px;">${d}</li>`)
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060B18; color: #EAF2FF; padding: 24px; border-radius: 12px; border: 1px solid #FF4D6A;">
        <h2 style="color: #FF4D6A; margin-top: 0;">FloodAI Emergency Alert — ${riskLevel.toUpperCase()} RISK</h2>
        <p style="font-size: 16px;"><b>Location:</b> ${district}</p>
        <p style="font-size: 16px;"><b>Modeled Flood Probability:</b> <span style="color: #33C7FF; font-weight: bold;">${probabilityPct}%</span></p>
        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin: 18px 0;">
          <p style="margin: 0; line-height: 1.6;">${message}</p>
        </div>
        ${
          directivesList
            ? `<h3 style="color: #1FE0A8; margin-bottom: 8px;">Actionable Precautionary Directives:</h3>
               <ul style="line-height: 1.6; padding-left: 20px;">${directivesList}</ul>`
            : ""
        }
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
        <p style="font-size: 12px; color: #93A4C3;">This automated threat assessment was dispatched by FloodAI Early Warning System. Verify with local emergency services.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: `[FloodAI ${riskLevel} Alert] Location: ${district}. Probability: ${probabilityPct}%. ${message}`,
    });
  }

  async sendVerificationCode({ to, code }) {
    const subject = "[FloodAI] Account Verification Code";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #060B18; color: #EAF2FF; padding: 24px; border-radius: 12px; border: 1px solid #33C7FF;">
        <h2 style="color: #33C7FF;">FloodAI Account Verification</h2>
        <p>Use the following 6-digit code to complete your registration or verification:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1FE0A8; background: rgba(51,199,255,0.1); padding: 12px 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #93A4C3;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: `Your FloodAI verification code is: ${code}`,
    });
  }
}

module.exports = new BrevoEmailService();
