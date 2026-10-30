import { ApiError } from '@/lib/api/types';
import { apiJson } from '@/lib/auth/session';

export type MediaDetails = {
  id: number;
  mediaType: string;
  externalSource: string;
  externalId: string;
  title: string;
  originalTitle?: string | null;
  description?: string | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  year?: number | null;
  score?: number | null;
  status?: string | null;
  genres?: string[] | null;
  totalUnits?: number | null;
  unitName?: string | null;
  totalSeasons?: number | null;
  totalVolumes?: number | null;
  runtimeMinutes?: number | null;
  platforms?: string[] | null;
  developer?: string | null;
};

export type MediaReview = {
  id: number;
  username: string;
  content: string;
  rating?: number | null;
  containsSpoilers: boolean;
  createdAt: string;
};

export type MediaLibraryEntry = {
  mediaId: number;
  status: string;
  progress?: number | null;
  rating?: number | null;
  isFavorite: boolean;
  platform?: string | null;
};

type Paged<T> = { items?: T[] };

export function fetchMediaDetails(id: number): Promise<MediaDetails> {
  return apiJson<MediaDetails>(`/media/${id}`);
}

export function fetchExternalMedia(params: {
  source: string;
  externalId: string;
  type: string;
}): Promise<MediaDetails> {
  const query = new URLSearchParams({
    source: params.source,
    id: params.externalId,
    type: params.type,
  });
  return apiJson<MediaDetails>(`/media/external?${query.toString()}`);
}

export async function fetchSimilarMedia(
  media: Pick<MediaDetails, 'id' | 'mediaType' | 'externalSource' | 'externalId'> & {
    genres?: string[] | null;
  },
  pageSize = 8,
): Promise<MediaDetails[]> {
  if (media.id > 0) {
    const page = await apiJson<Paged<MediaDetails>>(`/media/${media.id}/similar?pageSize=${pageSize}`);
    return (page.items ?? []).filter((item) => item.id !== media.id);
  }

  const query = new URLSearchParams({
    type: media.mediaType,
    source: media.externalSource,
    id: media.externalId,
    pageSize: String(pageSize),
  });
  const genres = (media.genres ?? []).filter(Boolean).slice(0, 3);
  if (genres.length > 0) query.set('genres', genres.join(','));

  const page = await apiJson<Paged<MediaDetails>>(`/media/similar?${query.toString()}`);
  return page.items ?? [];
}

/** Null when the title is not in the user's library (API answers 404). */
export async function fetchLibraryEntry(mediaId: number): Promise<MediaLibraryEntry | null> {
  try {
    return await apiJson<MediaLibraryEntry>(`/me/library/${mediaId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchMediaReviews(mediaId: number, pageSize = 3): Promise<MediaReview[]> {
  const page = await apiJson<Paged<MediaReview>>(
    `/reviews/media/${mediaId}/reviews?pageSize=${pageSize}`,
  );
  return page.items ?? [];
}

/** Adds a catalog or not-yet-stored external title to the user's library. */
export function addMediaToLibrary(
  media: MediaDetails,
  status: string,
): Promise<MediaLibraryEntry> {
  const identity =
    media.id > 0
      ? { mediaId: media.id }
      : { externalSource: media.externalSource, externalId: media.externalId };

  return apiJson<MediaLibraryEntry>('/me/library', {
    method: 'POST',
    body: JSON.stringify({
      ...identity,
      mediaType: media.mediaType,
      status,
      title: media.title,
      coverImage: media.coverImage ?? undefined,
      year: media.year ?? undefined,
      score: media.score ?? undefined,
      totalUnits: media.totalUnits ?? undefined,
      unitName: media.unitName ?? undefined,
      runtimeMinutes: media.runtimeMinutes ?? undefined,
      platforms: media.platforms ?? undefined,
      developer: media.developer ?? undefined,
    }),
  });
}
