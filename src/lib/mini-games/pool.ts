import { apiJson } from '@/lib/auth/session';
import type { MiniGamePoster } from '@/lib/api/mini-games';

export const ALL_TYPES = ['movie', 'series', 'anime', 'manga', 'game'];

export function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function posterKey(item: MiniGamePoster) {
  if (typeof item.id === 'number' && item.id > 0) return `id:${item.id}`;
  return `ext:${item.mediaType}:${item.externalSource}:${item.externalId}`;
}

/**
 * Catalog pool for the mini-games, assembled from the public trending and top
 * endpoints per media type. The web app builds this in its Next layer; the
 * API has no pool endpoint, so mobile does the same merge locally.
 */
export async function fetchCatalogPool(types: string[]): Promise<MiniGamePoster[]> {
  const poolTypes = types.length > 0 ? types : ALL_TYPES;
  const pages = await Promise.all(
    poolTypes.flatMap((type) => [
      apiJson<{ items?: MiniGamePoster[] }>(`/media/trending?type=${type}&pageSize=20`).catch(
        () => ({ items: [] }),
      ),
      apiJson<{ items?: MiniGamePoster[] }>(`/media/top?type=${type}&pageSize=20`).catch(
        () => ({ items: [] }),
      ),
    ]),
  );

  const seen = new Set<string>();
  const pool: MiniGamePoster[] = [];

  pages.forEach((page) => {
    (page.items ?? []).forEach((item) => {
      if (!item.title) return;
      const key = posterKey(item);
      if (seen.has(key)) return;
      seen.add(key);
      pool.push(item);
    });
  });

  return pool;
}
