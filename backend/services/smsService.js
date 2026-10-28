/**
 * smsService.js
 * Pluggable SMS Provider Abstraction supporting Twilio, Brevo SMS,
 * and a Development Sandbox provider.
 */

const axios = require("axios");

class SmsService {
  constructor() {
    this.providerName = this.detectProvider();
  }

  detectProvider() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      return "twilio";
    }
    if (process.env.BREVO_API_KEY && process.env.BREVO_SMS_SENDER) {
      return "brevo";
    }
    return "sandbox";
  }

  async sendSms({ to, message }) {
    if (!to) throw new Error("Recipient phone number is required");

    // Clean international phone format
    const normalizedPhone = to.replace(/[\s-]/g, "");

    switch (this.providerName) {
      case "twilio":
        return this.sendViaTwilio(normalizedPhone, message);
      case "brevo":
        return this.sendViaBrevo(normalizedPhone, message);
      case "sandbox":
      default:
        return this.sendViaSandbox(normalizedPhone, message);
    }
  }

  async sendOtp({ to, code }) {
    const message = `[FloodAI] Your verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
    return this.sendSms({ to, message });
  }

  async sendViaTwilio(to, message) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    const authHeader = Buffer.from(`${sid}:${auth}`).toString("base64");
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", from);
    params.append("Body", message);

    try {
      const res = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return {
        provider: "twilio",
        status: "sent",
        messageId: res.data.sid,
        to,
      };
    } catch (err) {
      console.error("[SMS:Twilio:Error]", err.response?.data || err.message);
      throw new Error(`Twilio dispatch failed: ${err.message}`);
    }
  }

  async sendViaBrevo(to, message) {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = process.env.BREVO_SMS_SENDER || "FloodAI";

    try {
      const res = await axios.post(
        "https://api.brevo.com/v3/transactionalSMS/send",
        {
          sender,
          recipient: to,
          content: message,
          type: "transactional",
        },
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        provider: "brevo",
        status: "sent",
        messageId: res.data.reference || res.data.smsId,
        to,
      };
    } catch (err) {
      console.error("[SMS:Brevo:Error]", err.response?.data || err.message);
      throw new Error(`Brevo SMS dispatch failed: ${err.message}`);
    }
  }

  async sendViaSandbox(to, message) {
    console.log("--------------------------------------------------");
    console.log(`[SMS:Sandbox] TO: ${to}`);
    console.log(`[SMS:Sandbox] MESSAGE: ${message}`);
    console.log("--------------------------------------------------");
    return {
      provider: "sandbox",
      status: "delivered",
      messageId: `sandbox_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      to,
      note: "Dispatched via FloodAI development SMS sandbox",
    };
  }
}

module.exports = new SmsService();
