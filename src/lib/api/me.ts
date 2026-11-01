import type { AuthUser } from '@/lib/api/types';
import { apiJson } from '@/lib/auth/session';

export type UpdateProfilePayload = {
  username?: string;
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
