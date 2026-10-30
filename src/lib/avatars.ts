// The 10 selectable profile avatars, copied from the web app's public/avatars.
// Ids must stay in sync with kue-web/lib/avatars.ts and Kue.Api/Constants/AvatarIds.cs.
export const AVATAR_IDS = [
  'fox',
  'owl',
  'frog',
  'bee',
  'bunny',
  'panda',
  'koala',
  'raccoon',
  'hedgehog',
  'penguin',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value);
}

const SOURCES: Record<AvatarId, number> = {
  fox: require('@/assets/avatars/fox.svg'),
  owl: require('@/assets/avatars/owl.svg'),
  frog: require('@/assets/avatars/frog.svg'),
  bee: require('@/assets/avatars/bee.svg'),
  bunny: require('@/assets/avatars/bunny.svg'),
  panda: require('@/assets/avatars/panda.svg'),
  koala: require('@/assets/avatars/koala.svg'),
  raccoon: require('@/assets/avatars/raccoon.svg'),
  hedgehog: require('@/assets/avatars/hedgehog.svg'),
  penguin: require('@/assets/avatars/penguin.svg'),
};

export function avatarSource(id: AvatarId) {
  return SOURCES[id];
}

export function initialOf(username: string) {
  return username.trim().charAt(0).toUpperCase() || '?';
}
