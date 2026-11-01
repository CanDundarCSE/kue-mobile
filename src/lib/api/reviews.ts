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
