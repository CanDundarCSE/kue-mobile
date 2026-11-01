import { apiJson } from '@/lib/auth/session';

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
  createdAt: string;
};

export type ReviewPage = {
  items: UserReview[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

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
