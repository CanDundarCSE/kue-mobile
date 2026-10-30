import { apiJson } from '@/lib/auth/session';
import type { MediaItem } from '@/lib/api/home';

type Paged<T> = { items?: T[]; page?: number; totalPages?: number; totalItems?: number };

/** Highest rated titles, optionally narrowed to one media type. */
export async function fetchTopRated(type?: string | null, pageSize = 10): Promise<MediaItem[]> {
  const query = new URLSearchParams({ pageSize: String(pageSize) });
  if (type) query.set('type', type);

  const page = await apiJson<Paged<MediaItem>>(`/media/top?${query.toString()}`);
  return page.items ?? [];
}

/** Trending titles; a type fans out across every catalog when omitted. */
export async function fetchTrendingByType(type?: string | null, pageSize = 10): Promise<MediaItem[]> {
  const query = new URLSearchParams({ pageSize: String(pageSize) });
  if (type) query.set('type', type);

  const page = await apiJson<Paged<MediaItem>>(`/media/trending?${query.toString()}`);
  return page.items ?? [];
}

export type SearchPage = {
  items: MediaItem[];
  page: number;
  totalPages: number;
  totalItems: number;
};

export async function searchMedia(params: {
  query: string;
  type?: string | null;
  sort?: string | null;
  year?: number | null;
  minScore?: number | null;
  page?: number;
  pageSize?: number;
}): Promise<SearchPage> {
  const query = new URLSearchParams({
    query: params.query,
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 24),
  });
  if (params.type) query.set('type', params.type);
  if (params.sort) query.set('sort', params.sort);
  if (params.year !== null && params.year !== undefined) query.set('year', String(params.year));
  if (params.minScore !== null && params.minScore !== undefined) {
    query.set('minScore', String(params.minScore));
  }

  const page = await apiJson<Paged<MediaItem>>(`/search?${query.toString()}`);

  return {
    items: page.items ?? [],
    page: page.page ?? 1,
    totalPages: page.totalPages ?? 0,
    totalItems: page.totalItems ?? 0,
  };
}
