import { apiJson } from '@/lib/auth/session';

export type SpoilerRange = { start: number; end: number };

export type UserReview = {
  id: number;
  userId: number;
  username: string;
  mediaId: number;
  mediaTitle: string;
  mediaType: string;
  mediaCoverImage: string;
  mediaYear?: number | null;
  content: string;
  rating?: number | null;
  containsSpoilers: boolean;
  spoilers?: SpoilerRange[] | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type ReviewPage = {
  items: UserReview[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ReviewPayload = {
  content: string;
  rating: number | null;
  containsSpoilers: boolean;
  spoilers: SpoilerRange[];
  isPublic: boolean;
};

export async function fetchMyReviews(
  page = 1,
  pageSize = 10,
  isPublic?: boolean | null,
): Promise<ReviewPage> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (isPublic !== undefined && isPublic !== null) {
    query.set('isPublic', String(isPublic));
  }

  const data = await apiJson<{
    items?: UserReview[];
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  }>(`/me/reviews?${query.toString()}`);

  return {
    items: data.items ?? [],
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    totalItems: data.totalItems ?? (data.items?.length ?? 0),
    totalPages: data.totalPages ?? 0,
  };
}

export function createReview(mediaId: number, payload: ReviewPayload): Promise<UserReview> {
  return apiJson<UserReview>('/me/reviews', {
    method: 'POST',
    body: JSON.stringify({ mediaId, ...payload }),
  });
}

export function updateReview(reviewId: number, payload: ReviewPayload): Promise<UserReview> {
  return apiJson<UserReview>(`/me/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteReview(reviewId: number): Promise<unknown> {
  return apiJson(`/me/reviews/${reviewId}`, { method: 'DELETE' });
}

export type MediaReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

export async function fetchMediaReviewPage(
  mediaId: number,
  options: { page?: number; pageSize?: number; sort?: MediaReviewSort; hideSpoilers?: boolean } = {},
): Promise<ReviewPage> {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 10),
  });
  if (options.sort) query.set('sort', options.sort);
  if (options.hideSpoilers) query.set('hideSpoilers', 'true');

  const data = await apiJson<{
    items?: UserReview[];
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  }>(`/media/${mediaId}/reviews?${query.toString()}`);

  return {
    items: data.items ?? [],
    page: data.page ?? 1,
    pageSize: data.pageSize ?? (options.pageSize ?? 10),
    totalItems: data.totalItems ?? (data.items?.length ?? 0),
    totalPages: data.totalPages ?? 0,
  };
}

export async function fetchMyReviewForMedia(mediaId: number): Promise<UserReview | null> {
  try {
    return await apiJson<UserReview>(`/me/reviews/by-media/${mediaId}`);
  } catch (cause) {
    if (cause instanceof Error && 'status' in cause && (cause as { status: number }).status === 404) {
      return null;
    }
    throw cause;
  }
}

/** Public reviews written by one user. Private profiles return 403. */
export async function fetchUserReviews(
  username: string,
  page = 1,
  pageSize = 10,
): Promise<ReviewPage> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const data = await apiJson<{
    items?: UserReview[];
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  }>(`/users/${encodeURIComponent(username.trim())}/reviews?${query.toString()}`);

  return {
    items: data.items ?? [],
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    totalItems: data.totalItems ?? (data.items?.length ?? 0),
    totalPages: data.totalPages ?? 0,
  };
}
