import { apiJson } from '@/lib/auth/session';

export type AddonCredential = {
  id: number;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AddonStatus = {
  configured: boolean;
  credentials: AddonCredential[];
};

export type AddonCreated = {
  token: string;
  manifestUrl: string;
  id: number;
  label: string | null;
  createdAt: string;
};

export function fetchAddonStatus(): Promise<AddonStatus> {
  return apiJson<AddonStatus>('/me/addon/credentials');
}

export function createAddonCredential(label?: string): Promise<AddonCreated> {
  return apiJson<AddonCreated>('/me/addon/credentials', {
    method: 'POST',
    body: JSON.stringify({ label: label ?? null }),
  });
}

export async function revokeAddonCredential(id?: number): Promise<void> {
  const path = id === undefined ? '/me/addon/credentials' : `/me/addon/credentials/${id}`;
  await apiJson(path, { method: 'DELETE' });
}
