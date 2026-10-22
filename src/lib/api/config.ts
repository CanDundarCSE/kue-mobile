const RAW_BASE_URL =
  process.env.EXPO_PUBLIC_KUE_API_URL ?? "https://kue-backend-e61h.onrender.com";

// Registration and the legal documents live on the web app. Fall back to the
// deployed origin so those links work in a fresh checkout where the optional
// env var has not been set yet; an explicit value still wins.
const RAW_WEB_URL =
  process.env.EXPO_PUBLIC_KUE_WEB_URL?.trim() || "https://kue-murex.vercel.app";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const API_HEALTH_URL = `${API_BASE_URL}/api/test`;

/** Optional: the deployed web app, used for legal pages and web-only flows. */
export const WEB_BASE_URL = RAW_WEB_URL.replace(/\/+$/, "");
