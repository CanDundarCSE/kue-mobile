import type { Href } from 'expo-router';

type MediaRef = {
  id: number;
  mediaType: string;
  externalSource?: string | null;
  externalId?: string | null;
};

/** Detail route for a catalog item, or for an external-only item (id 0). */
export function mediaHref(item: MediaRef): Href {
  if (item.id > 0) {
    return { pathname: '/media/[id]', params: { id: String(item.id) } };
  }

  return {
    pathname: '/media/[id]',
    params: {
      id: '0',
      source: item.externalSource ?? '',
      externalId: item.externalId ?? '',
      type: item.mediaType,
    },
  };
}
