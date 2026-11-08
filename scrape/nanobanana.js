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

import { randomBytes } from "node:crypto";

const BASE_URL = "https://api2.ashirwadinfotech.com:22993";

const toBlob = async (input) => {
  if (typeof input === "string") {
    let res = await fetch(input);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const html = await res.text();
      const match = html.match(/<img[^>]+id=["']img_preview["'][^>]+src=["']([^"']+)["']/i) ||
                    html.match(/<a[^>]+class=["']download["'][^>]+href=["']([^"']+)["']/i);
      if (match) {
        res = await fetch(match[1]);
      }
    }
    return await res.blob();
  }
  if (input instanceof Blob) {
    return input;
  }
  return new Blob([input]);
};

const createDeviceSession = async () => {
  const id = randomBytes(8).toString("hex");
  const form = new FormData();
  form.append("android_id", id);
  form.append("app_id", "dalle2-bhargav");
  form.append("in_app", "");
  form.append("in_app_sku", "");
  form.append("app_version", "20");
  form.append("package_name", "com.bhargav.nanobananaai");
  form.append("is_premium", "false");
  form.append("fcm_token", "");
  form.append("country_code", "US");

  const res = await fetch(`${BASE_URL}/api/image/android-app-config/`, {
    method: "POST",
    headers: { "User-Agent": "okhttp/4.12.0" },
    body: form
  });

  if (!res.ok) {
    throw new Error("Device initialization failed");
  }

  return id;
};

const pollJob = async (jobId, timeoutMs = 90000) => {
  const start = Date.now();
  const pollUrl = `${BASE_URL}/api/image/image-generator/${jobId}/`;
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(pollUrl, {
      headers: { "User-Agent": "okhttp/4.12.0" }
    });
    const data = await res.json();
    if (data.status === "COMPLETED") {
      return data.output;
    }
    if (data.status === "FAILED") {
      throw new Error(data.error || "Generation failed");
    }
  }
  throw new Error("Polling timeout");
};

const executeTask = async ({ imageBlob, prompt = "", processType, extraFields = {}, timeoutMs = 90000 }) => {
  const androidId = await createDeviceSession();
  const form = new FormData();
  if (imageBlob) {
    form.append("image", imageBlob, "input.png");
  }
  form.append("prompt", prompt);
  form.append("app_id", "dalle2-bhargav");
  form.append("android_id", androidId);
  form.append("is_premium", "false");
  form.append("app_version", "20");
  form.append("process_type", processType);
  form.append("image_style", extraFields.style || "");
  form.append("aspect_ratio", extraFields.aspectRatio || "square");
  form.append("scale", String(extraFields.scale || 12));
  form.append("steps", String(extraFields.steps || 20));
  form.append("enhance", "false");
  form.append("baby_gender", "");
  form.append("baby_age", "");
  form.append("cloth_type", "");
  form.append("room_style", "");
  form.append("interior_style", "");
  form.append("color_palette", "");
  form.append("is_ref_image", imageBlob ? "true" : "false");
  form.append("name", "");
  form.append("accessories", "");
  form.append("country_code", "US");
  form.append("trend_name", extraFields.trendName || processType);
  form.append("use_queue", "true");

  for (const [k, v] of Object.entries(extraFields)) {
    if (!["style", "aspectRatio", "scale", "steps", "trendName"].includes(k)) {
      form.set(k, String(v));
    }
  }

  const res = await fetch(`${BASE_URL}/api/image/image-generator/`, {
    method: "POST",
    headers: { "User-Agent": "okhttp/4.12.0" },
    body: form
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.[0] || data.output?.[0] || "Request failed");
  }

  const url = await pollJob(data.job_id, timeoutMs);
  return { success: true, url, jobId: data.job_id };
};

export async function textToImage(prompt, options = {}) {
  return await executeTask({
    prompt,
    processType: "text_to_image",
    extraFields: options,
    timeoutMs: options.timeoutMs
  });
}

export async function imageToImage(image, prompt, options = {}) {
  const imageBlob = await toBlob(image);
  return await executeTask({
    imageBlob,
    prompt,
    processType: "image_to_image",
    extraFields: options,
    timeoutMs: options.timeoutMs
  });
}

export async function removeBg(image, options = {}) {
  const imageBlob = await toBlob(image);
  return await executeTask({
    imageBlob,
    processType: "remove_bg",
    extraFields: { trendName: "Remove Background", ...options },
    timeoutMs: options.timeoutMs
  });
}

export async function upscale(image, options = {}) {
  const imageBlob = await toBlob(image);
  const scale = options.scale || 2;
  return await executeTask({
    imageBlob,
    processType: "image_upscale",
    extraFields: { upscale_value: scale, trendName: "Image Enhance", ...options },
    timeoutMs: options.timeoutMs
  });
}

export async function getMasterData() {
  const res = await fetch(`${BASE_URL}/api/image/fetch-app-data/?app_id=dalle2`, {
    headers: { "User-Agent": "okhttp/4.12.0" }
  });
  if (!res.ok) {
    throw new Error("Failed to fetch master data");
  }
  return await res.json();
}

export default {
  textToImage,
  generate: textToImage,
  imageToImage,
  removeBg,
  upscale,
  getMasterData
};
