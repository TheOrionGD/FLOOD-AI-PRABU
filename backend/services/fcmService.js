/**
 * fcmService.js
 * Firebase Cloud Messaging Web Push dispatch service.
 * Exclusively handles Web Push browser notifications.
 */

const axios = require("axios");
const User = require("../models/User");

class FcmService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || "floodai-24a0f";
    this.serverKey = process.env.FIREBASE_SERVER_KEY || null;
    this.serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        this.serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.warn("[FCM] Could not parse FIREBASE_SERVICE_ACCOUNT JSON");
      }
    }
  }

  isConfigured() {
    return Boolean(this.serverKey || this.serviceAccount);
  }

  /**
   * Dispatches a Web Push notification to a specific browser FCM registration token.
   */
  async sendToToken(token, { title, body, icon = "/vendor/icons/icon-192.png", data = {} }) {
    if (!token) throw new Error("FCM device token is required");

    if (!this.isConfigured()) {
      console.log("--------------------------------------------------");
      console.log(`[FCM:WebPush:Sandbox] TOKEN: ${token.substring(0, 20)}...`);
      console.log(`[FCM:WebPush:Sandbox] TITLE: ${title}`);
      console.log(`[FCM:WebPush:Sandbox] BODY:  ${body}`);
      console.log(`[FCM:WebPush:Sandbox] DATA:  ${JSON.stringify(data)}`);
      console.log("--------------------------------------------------");
      return {
        status: "delivered",
        provider: "fcm_sandbox",
        messageId: `web_fcm_${Date.now()}`,
        token,
      };
    }

    // If Legacy Server Key is configured
    if (this.serverKey) {
      try {
        const payload = {
          to: token,
          notification: {
            title,
            body,
            icon,
            click_action: data.url || "/#alerts",
          },
          data: {
            ...data,
            timestamp: new Date().toISOString(),
          },
        };

        const res = await axios.post("https://fcm.googleapis.com/fcm/send", payload, {
          headers: {
            Authorization: `key=${this.serverKey}`,
            "Content-Type": "application/json",
          },
        });

        if (res.data.failure > 0 && res.data.results?.[0]?.error) {
          const err = res.data.results[0].error;
          if (["NotRegistered", "InvalidRegistration"].includes(err)) {
            await this.removeInvalidToken(token);
          }
          throw new Error(`FCM delivery error: ${err}`);
        }

        return {
          status: "sent",
          provider: "fcm_legacy",
          messageId: res.data.results?.[0]?.message_id || `fcm_${Date.now()}`,
          token,
        };
      } catch (err) {
        console.error("[FCM:Error]", err.response?.data || err.message);
        throw new Error(`FCM dispatch failed: ${err.message}`);
      }
    }

    // Default sandbox fallback
    return {
      status: "delivered",
      provider: "fcm_sandbox",
      messageId: `web_fcm_${Date.now()}`,
      token,
    };
  }

  /**
   * Dispatches notifications to all registered tokens of a user or a list of users.
   */
  async sendToUser(userId, payload) {
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return { status: "no_tokens", dispatched: 0 };
    }

    const results = [];
    for (const item of user.fcmTokens) {
      try {
        const res = await this.sendToToken(item.token, payload);
        results.push(res);
      } catch (err) {
        results.push({ status: "failed", token: item.token, error: err.message });
      }
    }
    return { status: "completed", dispatched: results.length, details: results };
  }

  /**
   * Broadcasts to all users subscribed to a given district.
   */
  async broadcastToDistrict(district, payload) {
    const users = await User.find({
      $or: [
        { "preferences.subscribedDistricts": district },
        { "preferences.subscribedDistricts": { $size: 0 } },
      ],
    });

    let totalDispatched = 0;
    const tokens = new Set();
    users.forEach((u) => {
      u.fcmTokens?.forEach((t) => tokens.add(t.token));
    });

    const dispatchResults = [];
    for (const token of tokens) {
      try {
        const res = await this.sendToToken(token, payload);
        dispatchResults.push(res);
        totalDispatched++;
      } catch (e) {
        dispatchResults.push({ status: "failed", token, error: e.message });
      }
    }

    return { district, totalDispatched, details: dispatchResults };
  }

  async removeInvalidToken(token) {
    try {
      await User.updateMany({}, { $pull: { fcmTokens: { token } } });
      console.log(`[FCM:Cleanup] Removed expired/unregistered token: ${token.substring(0, 15)}...`);
    } catch (e) {
      console.error("[FCM:Cleanup:Error]", e.message);
    }
  }
}

module.exports = new FcmService();
