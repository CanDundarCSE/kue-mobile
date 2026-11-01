import type { AuthUser } from '@/lib/api/types';
import { apiJson } from '@/lib/auth/session';

export type UpdateProfilePayload = {
  username?: string;
  email?: string;
  bio?: string | null;
  avatarId?: string | null;
  isPrivate?: boolean;
};

/** Updates the signed-in user's profile. An empty avatarId clears the avatar. */
export function updateMe(payload: UpdateProfilePayload): Promise<AuthUser> {
  return apiJson<AuthUser>('/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Returns nothing on success; throws the API message otherwise. */
export function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<unknown> {
  return apiJson('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteAccount(): Promise<unknown> {
  return apiJson('/me', { method: 'DELETE' });
}
