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
    this.sseClients = new Set();
    this.guestTokens = new Set();

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

  addSseClient(res) {
    this.sseClients.add(res);
    try {
      res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);
    } catch (_) {}
  }

  removeSseClient(res) {
    this.sseClients.delete(res);
  }

  broadcastSse(message) {
    const payloadStr = `data: ${JSON.stringify(message)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payloadStr);
      } catch (e) {
        this.sseClients.delete(client);
      }
    }
  }

  registerGuestToken(token) {
    if (token) this.guestTokens.add(token);
  }

  /**
   * Dispatches a Web Push notification to a specific browser FCM registration token.
   */
  async sendToToken(token, { title, body, icon = "/vendor/icons/icon-192.png", data = {} }) {
    if (!token) throw new Error("FCM device token is required");

    // Real-time broadcast to all connected active client streams
    this.broadcastSse({
      type: "notification",
      payload: {
        title,
        body,
        icon,
        data,
      },
      targetToken: token,
      timestamp: new Date().toISOString(),
    });

    if (!this.isConfigured()) {
      console.log("--------------------------------------------------");
      console.log(`[FCM:WebPush:SSE] Broadcasted to connected client streams. TOKEN: ${token.substring(0, 20)}...`);
      console.log(`[FCM:WebPush:SSE] TITLE: ${title}`);
      console.log(`[FCM:WebPush:SSE] BODY:  ${body}`);
      console.log("--------------------------------------------------");
      return {
        status: "sse_stream_broadcast",
        provider: "fcm_stream",
        messageId: `sse_fcm_${Date.now()}`,
        token,
        note: "Broadcast to active in-browser Server-Sent Events streams (FCM Server Key unconfigured)",
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
          status: "accepted",
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
      status: "sandbox_simulated",
      provider: "fcm_sandbox",
      messageId: `web_fcm_${Date.now()}`,
      token,
      note: "Dispatched to local sandbox (unconfigured FCM)",
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

    // Include all active guest browser tokens
    this.guestTokens.forEach((t) => tokens.add(t));

    // Broadcast in real-time to all connected browser SSE client streams
    this.broadcastSse({
      type: "notification",
      payload: {
        ...payload,
        district,
      },
      timestamp: new Date().toISOString(),
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
      this.guestTokens.delete(token);
      await User.updateMany({}, { $pull: { fcmTokens: { token } } });
      console.log(`[FCM:Cleanup] Removed expired/unregistered token: ${token.substring(0, 15)}...`);
    } catch (e) {
      console.error("[FCM:Cleanup:Error]", e.message);
    }
  }
}

module.exports = new FcmService();
