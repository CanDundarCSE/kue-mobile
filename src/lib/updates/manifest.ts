import { WEB_BASE_URL } from '@/lib/api/config';

/** Published on the web app; see `kue-web/public/app/latest.json`. */
export const UPDATE_MANIFEST_URL =
  process.env.EXPO_PUBLIC_UPDATE_MANIFEST_URL?.trim() ||
  `${WEB_BASE_URL}/app/latest.json`;

export type UpdateManifest = {
  version: string;
  versionCode: number;
  apkUrl: string;
  sha256?: string;
  notes?: string;
  minVersionCode?: number;
};

/** Returns the published build, or null when the manifest is missing/invalid. */
export async function fetchUpdateManifest(): Promise<UpdateManifest | null> {
  const response = await fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!response?.ok) return null;

  const data = (await response.json().catch(() => null)) as Partial<UpdateManifest> | null;
  if (!data || typeof data.apkUrl !== 'string' || typeof data.versionCode !== 'number') {
    return null;
  }

  return {
    version: typeof data.version === 'string' ? data.version : String(data.versionCode),
    versionCode: data.versionCode,
    apkUrl: data.apkUrl,
    sha256: data.sha256,
    notes: data.notes,
    minVersionCode: data.minVersionCode,
  };
}
