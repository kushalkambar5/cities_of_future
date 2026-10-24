import { config } from '../config/env.js';

interface OpenWASession {
  id: string;
  name: string;
  status: string;
  phone?: string;
}

let cachedSessionId: string | null = null;
let lastSessionCheck = 0;

/**
 * Discovers active, ready session from OpenWA
 */
export async function getActiveOpenWASession(): Promise<string | null> {
  const now = Date.now();
  if (cachedSessionId && now - lastSessionCheck < 60_000) {
    return cachedSessionId;
  }

  try {
    const url = `${config.openwa.url}/sessions`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.openwa.apiKey,
      },
    });

    if (!res.ok) {
      console.warn(`[OpenWA] Failed to fetch sessions: HTTP ${res.status}`);
      return cachedSessionId;
    }

    const data: any = await res.json();
    const sessions: OpenWASession[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.value)
      ? data.value
      : [];

    const readySession = sessions.find((s) => s.status?.toLowerCase() === 'ready') || sessions[0];
    if (readySession) {
      cachedSessionId = readySession.id;
      lastSessionCheck = now;
      console.log(`[OpenWA] Using ready session '${readySession.name}' (${readySession.id})`);
      return readySession.id;
    }

    console.warn('[OpenWA] No active ready sessions found in OpenWA server.');
    return null;
  } catch (err: any) {
    console.error(`[OpenWA] Connection error connecting to ${config.openwa.url}:`, err.message);
    return null;
  }
}

/**
 * Normalizes a phone number to WhatsApp chatId format (e.g. 919035035884@c.us)
 */
export function formatToWhatsAppChatId(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  // Default to India country code 91 if standard 10 digit number provided
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return `${digits}@c.us`;
}

/**
 * Sends a text message via OpenWA
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sessionId = await getActiveOpenWASession();
    if (!sessionId) {
      return { success: false, error: 'No active OpenWA WhatsApp session available' };
    }

    const chatId = formatToWhatsAppChatId(phone);
    if (!chatId) {
      return { success: false, error: 'Invalid phone number' };
    }

    const url = `${config.openwa.url}/sessions/${sessionId}/messages/send-text`;
    const payload = {
      chatId,
      text,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.openwa.apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const respData: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = respData?.message || `HTTP ${res.status}`;
      console.error(`[OpenWA] send-text failed to ${chatId}:`, errMsg);
      return { success: false, error: errMsg };
    }

    console.log(`[OpenWA] Text sent successfully to ${chatId}`);
    return { success: true, messageId: respData?.id || respData?.messageId };
  } catch (err: any) {
    console.error(`[OpenWA] Error sending text to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a PDF document via OpenWA
 */
export async function sendWhatsAppDocument(
  phone: string,
  pdfUrlOrBase64: { url?: string; base64?: string },
  filename: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sessionId = await getActiveOpenWASession();
    if (!sessionId) {
      return { success: false, error: 'No active OpenWA WhatsApp session available' };
    }

    const chatId = formatToWhatsAppChatId(phone);
    if (!chatId) {
      return { success: false, error: 'Invalid phone number' };
    }

    const url = `${config.openwa.url}/sessions/${sessionId}/messages/send-document`;
    const payload: any = {
      chatId,
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      mimetype: 'application/pdf',
      caption: caption || `Official Document: ${filename}`,
    };

    if (pdfUrlOrBase64.url) {
      payload.url = pdfUrlOrBase64.url;
    } else if (pdfUrlOrBase64.base64) {
      payload.base64 = pdfUrlOrBase64.base64;
    } else {
      return { success: false, error: 'Neither URL nor base64 buffer provided for document send' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.openwa.apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const respData: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = respData?.message || `HTTP ${res.status}`;
      console.error(`[OpenWA] send-document failed to ${chatId}:`, errMsg);
      return { success: false, error: errMsg };
    }

    console.log(`[OpenWA] Document '${filename}' sent successfully to ${chatId}`);
    return { success: true, messageId: respData?.id || respData?.messageId };
  } catch (err: any) {
    console.error(`[OpenWA] Error sending document to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a video file via OpenWA
 */
export async function sendWhatsAppVideo(
  phone: string,
  videoUrlOrBase64: { url?: string; base64?: string },
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sessionId = await getActiveOpenWASession();
    if (!sessionId) {
      return { success: false, error: 'No active OpenWA WhatsApp session available' };
    }

    const chatId = formatToWhatsAppChatId(phone);
    if (!chatId) {
      return { success: false, error: 'Invalid phone number' };
    }

    const url = `${config.openwa.url}/sessions/${sessionId}/messages/send-video`;
    const payload: any = {
      chatId,
      caption: caption || 'Automated Traffic Violation Video Footage',
    };

    if (videoUrlOrBase64.url) {
      payload.url = videoUrlOrBase64.url;
    } else if (videoUrlOrBase64.base64) {
      payload.base64 = videoUrlOrBase64.base64;
      payload.mimetype = 'video/mp4';
    } else {
      return { success: false, error: 'Neither URL nor base64 buffer provided for video send' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.openwa.apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });

    const respData: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = respData?.message || `HTTP ${res.status}`;
      console.error(`[OpenWA] send-video failed to ${chatId}:`, errMsg);
      return { success: false, error: errMsg };
    }

    console.log(`[OpenWA] Video sent successfully to ${chatId}`);
    return { success: true, messageId: respData?.id || respData?.messageId };
  } catch (err: any) {
    console.error(`[OpenWA] Error sending video to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}
