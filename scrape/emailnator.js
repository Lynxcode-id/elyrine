/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

export const HOST = "https://www.emailnator.com";

export const API = {
  generate: `${HOST}/api/generate-email`,
  bulk: `${HOST}/api/generate-bulk-email`,
  inbox: `${HOST}/api/message-list`,
  extend: `${HOST}/api/extend-email`,
  message: `${HOST}/api/message`,
  deleteMessage: `${HOST}/api/delete-message`,
};

export const EMAIL_TYPES = {
  domain: 1,
  plusGmail: 2,
  dotGmail: 3,
  googleMail: 8,
};

export const TYPE_BY_ID = Object.fromEntries(
  Object.entries(EMAIL_TYPES).map(([name, id]) => [id, name]),
);

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Content-Type": "application/json",
  Origin: HOST,
  Referer: `${HOST}/`,
};

const BULK_CHUNK = 500;
const MESSAGE_LIMIT = 10;
const DEFAULT_TIMEOUT_MS = 30_000;

function withTimeout(ms = DEFAULT_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

async function parseJsonSafe(res) {
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err = new Error(
      `HTTP ${res.status} ${res.statusText}${json ? `: ${JSON.stringify(json)}` : `: ${text.slice(0, 300)}`}`,
    );
    err.status = res.status;
    err.body = json ?? text;
    throw err;
  }
  if (json === null) {
    const err = new Error(`Non-JSON response: ${text.slice(0, 300)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return json;
}

function resolveIds(input) {
  if (input === undefined || input === null) return Object.values(EMAIL_TYPES);
  if (typeof input === "number") return [input];
  if (typeof input === "string") {
    const id = EMAIL_TYPES[input] ?? Number(input);
    return Number.isFinite(id) ? [id] : Object.values(EMAIL_TYPES);
  }
  if (Array.isArray(input)) {
    const ids = [];
    for (const item of input) {
      if (typeof item === "number") {
        ids.push(item);
      } else if (typeof item === "string") {
        const id = EMAIL_TYPES[item] ?? Number(item);
        if (Number.isFinite(id)) ids.push(id);
      }
    }
    return ids.length ? ids : Object.values(EMAIL_TYPES);
  }
  if (typeof input === "object") {
    return resolveIds(Object.keys(input).filter((key) => input[key]));
  }
  throw new TypeError("ids must be a number, string, array, or type map");
}

function normalizeAddress(raw, fallbackIds) {
  if (!raw?.email) return null;
  const typeId = Number(raw.email_type_id ?? fallbackIds[0] ?? 0);
  return {
    email: String(raw.email).trim(),
    type: raw.type ?? null,
    typeId: Number.isFinite(typeId) ? typeId : null,
    typeName: TYPE_BY_ID[typeId] ?? null,
  };
}

function normalizeMessage(raw) {
  return {
    id: raw?.id ?? raw?.message_id ?? null,
    from: raw?.from ?? raw?.sender ?? null,
    subject: raw?.subject ?? null,
    preview: raw?.preview ?? raw?.snippet ?? null,
    body: raw?.body ?? raw?.html ?? raw?.message ?? null,
    receivedAt: raw?.received_at ?? raw?.date ?? raw?.created_at ?? null,
    raw,
  };
}

export async function generateEmail(ids = null, options = {}) {
  const typeIds = resolveIds(ids);
  const { signal, done } = withTimeout(options.timeoutMs);
  try {
    const res = await fetch(API.generate, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ ids: typeIds }),
      signal,
    });
    const json = await parseJsonSafe(res);
    if (json.status !== "success") {
      throw new Error(json.message ?? json.error ?? "generate-email failed");
    }
    return normalizeAddress(json, typeIds);
  } finally {
    done();
  }
}

export async function generateBulk(count = 10, ids = null, options = {}) {
  const total = Number(count);
  if (!Number.isFinite(total) || total <= 0) {
    throw new TypeError("count must be a positive number");
  }
  const typeIds = resolveIds(ids);
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || 5);
  const seen = new Map();
  const errors = [];
  let attempts = 0;

  while (seen.size < Math.floor(total) && attempts < maxAttempts) {
    attempts += 1;
    const batch = Math.min(Math.floor(total) - seen.size, BULK_CHUNK);
    const { signal, done } = withTimeout(options.timeoutMs ?? 60_000);
    try {
      const res = await fetch(API.bulk, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ ids: typeIds, count: batch }),
        signal,
      });
      const json = await parseJsonSafe(res);
      if (json.status !== "success") {
        errors.push(json.message ?? json.error ?? "generate-bulk-email failed");
      } else {
        for (const item of json.results ?? []) {
          const address = normalizeAddress(item, typeIds);
          if (address && !seen.has(address.email)) seen.set(address.email, address);
        }
        if (!(json.results ?? []).length) {
          errors.push("empty batch");
        }
      }
    } catch (error) {
      errors.push(error.message);
    } finally {
      done();
    }
    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }

  const addresses = [...seen.values()];
  return {
    requested: Math.floor(total),
    received: addresses.length,
    unique: addresses.length,
    complete: addresses.length >= Math.floor(total),
    attempts,
    errors,
    addresses,
  };
}

export async function getInbox(email, options = {}) {
  if (!email || typeof email !== "string") {
    throw new TypeError("email must be a non-empty string");
  }
  const { signal, done } = withTimeout(options.timeoutMs);
  try {
    const res = await fetch(API.inbox, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email: email.trim(), limit: options.limit ?? 20 }),
      signal,
    });
    const json = await parseJsonSafe(res);
    if (json.status !== "success") {
      throw new Error(json.message ?? json.error ?? "message-list failed");
    }
    const messages = (json.messages ?? []).map(normalizeMessage);
    return {
      email: email.trim(),
      messages,
      count: Number(json.message_count ?? messages.length) || 0,
      limit: Number(json.message_limit ?? MESSAGE_LIMIT) || MESSAGE_LIMIT,
      upgradeAvailable: Boolean(json.upgrade_available),
      full: Number(json.message_count ?? 0) >= Number(json.message_limit ?? MESSAGE_LIMIT),
    };
  } finally {
    done();
  }
}

export async function getMessage(messageId, options = {}) {
  if (!messageId || typeof messageId !== "string") {
    throw new TypeError("messageId must be a non-empty string");
  }
  const { signal, done } = withTimeout(options.timeoutMs);
  try {
    const res = await fetch(`${API.message}/${encodeURIComponent(messageId)}`, {
      headers: DEFAULT_HEADERS,
      signal,
    });
    const json = await parseJsonSafe(res);
    if (json.status !== "success") {
      throw new Error(json.message ?? json.error ?? "message failed");
    }
    return normalizeMessage(json.message ?? json);
  } finally {
    done();
  }
}

export async function deleteMessage(messageId, options = {}) {
  if (!messageId || typeof messageId !== "string") {
    throw new TypeError("messageId must be a non-empty string");
  }
  const { signal, done } = withTimeout(options.timeoutMs);
  try {
    const res = await fetch(`${API.deleteMessage}/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
      headers: DEFAULT_HEADERS,
      signal,
    });
    const json = await parseJsonSafe(res);
    return {
      ok: json.status === "success",
      message: json.message ?? null,
      raw: json,
    };
  } finally {
    done();
  }
}

export async function extendEmail(email, options = {}) {
  if (!email || typeof email !== "string") {
    throw new TypeError("email must be a non-empty string");
  }
  const { signal, done } = withTimeout(options.timeoutMs);
  try {
    const res = await fetch(API.extend, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email: email.trim() }),
      signal,
    });
    const json = await parseJsonSafe(res);
    return {
      ok: json.status === "success",
      email: email.trim(),
      message: json.message ?? null,
      raw: json,
    };
  } finally {
    done();
  }
}

export async function waitForMessage(email, options = {}) {
  if (!email || typeof email !== "string") {
    throw new TypeError("email must be a non-empty string");
  }
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 5_000;
  const started = Date.now();
  let seen = new Set();

  while (Date.now() - started < timeoutMs) {
    const inbox = await getInbox(email, options);
    const fresh = inbox.messages.filter((m) => m.id && !seen.has(m.id));
    if (fresh.length) {
      return { email: email.trim(), matched: fresh, inbox };
    }
    seen = new Set(inbox.messages.map((m) => m.id).filter(Boolean));
    if (inbox.messages.length && !options.match) {
      return { email: email.trim(), matched: inbox.messages, inbox };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`No message received for ${email} within ${timeoutMs}ms`);
}

export async function createInbox(ids = null, options = {}) {
  const address = await generateEmail(ids, options);
  return {
    ...address,
    inboxUrl: `${HOST}/inbox#${address.email}`,
  };
}

export default {
  HOST,
  API,
  EMAIL_TYPES,
  TYPE_BY_ID,
  generateEmail,
  generateBulk,
  getInbox,
  getMessage,
  deleteMessage,
  extendEmail,
  waitForMessage,
  createInbox,
};
