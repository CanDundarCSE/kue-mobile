const RAW_BASE_URL =
  process.env.EXPO_PUBLIC_KUE_API_URL ?? "https://kue-backend-e61h.onrender.com";

const RAW_WEB_URL = process.env.EXPO_PUBLIC_KUE_WEB_URL ?? "";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const API_HEALTH_URL = `${API_BASE_URL}/api/test`;

/** Optional: the deployed web app, used for legal pages and web-only flows. */
export const WEB_BASE_URL = RAW_WEB_URL.replace(/\/+$/, "");
