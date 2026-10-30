import { apiFetch, apiJson } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/types';

export type LibraryMedia = {
  id: number;
  title: string;
  mediaType: string;
  coverImage?: string | null;
  year?: number | null;
  score?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  platforms?: string[] | null;
  externalSource?: string | null;
  externalId?: string | null;
};

export type LibraryEntry = {
  id: number;
  mediaId: number;
  mediaType: string;
  status: string;
  isFavorite: boolean;
  rating?: number | null;
  platform?: string | null;
  progress?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  updatedAt?: string | null;
  media: LibraryMedia;
};

export type Paged<T> = {
  items?: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type TypeBreakdown = { total: number };

export type StatsOverview = {
  totalItems: number;
  totalCompleted: number;
  totalInProgress: number;
  totalPlanned: number;
  totalDropped: number;
  totalOnHold: number;
  totalFavorites: number;
  movie?: TypeBreakdown;
  series?: TypeBreakdown;
  game?: TypeBreakdown;
  anime?: TypeBreakdown;
  manga?: TypeBreakdown;
};

export function fetchLibrary(params: {
  type?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<LibraryEntry>> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);

  return apiJson<Paged<LibraryEntry>>(`/me/library?${query.toString()}`);
}

export function fetchLibraryOverview(): Promise<StatsOverview> {
  return apiJson<StatsOverview>('/me/stats/overview');
}

export type UpdateLibraryParams = {
  status?: string;
  progress?: number;
  rating?: number;
  platform?: string;
  isFavorite?: boolean;
};

export function updateLibraryEntry(
  mediaId: number,
  params: UpdateLibraryParams,
): Promise<LibraryEntry> {
  return apiJson<LibraryEntry>(`/me/library/${mediaId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteLibraryEntry(mediaId: number): Promise<void> {
  const response = await apiFetch(`/me/library/${mediaId}`, { method: 'DELETE' });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      (body as { message?: string } | null)?.message ?? 'Could not remove this title.',
      response.status,
      body,
    );
  }
}
