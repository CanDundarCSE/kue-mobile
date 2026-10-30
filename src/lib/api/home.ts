import { apiJson } from "@/lib/auth/session";

/** Library entry as returned by `/me/library/continue`. */
export type ContinueEntry = {
  mediaId: number;
  mediaType: string;
  status: string;
  progress?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  media: {
    id: number;
    title: string;
    mediaType: string;
    coverImage?: string | null;
    year?: number | null;
    totalUnits?: number | null;
    unitName?: string | null;
  };
};

/** Trimmed media shape shared by the similar and trending endpoints. */
export type MediaItem = {
  id: number;
  externalSource?: string | null;
  externalId?: string | null;
  mediaType: string;
  title: string;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
};

/** External items come back with `id: 0`, so key them by source + external id. */
export function mediaKey(item: MediaItem) {
  return item.id > 0 ? `id:${item.id}` : `${item.externalSource}:${item.externalId}`;
}

export type FriendActivity = {
  id: number;
  username: string;
  avatarId?: string | null;
  formattedText: string;
  timeAgo: string;
};

export type Spotlight = {
  kicker: string;
  title: string;
  items: MediaItem[];
};

type Paged<T> = { items?: T[] };

export function fetchContinue(): Promise<ContinueEntry[]> {
  return apiJson<ContinueEntry[]>("/me/library/continue");
}

export async function fetchFriendActivity(pageSize = 3): Promise<FriendActivity[]> {
  const items = await apiJson<FriendActivity[]>(
    `/friends/activity?page=1&pageSize=${pageSize}`,
  );
  return Array.isArray(items) ? items : [];
}

export async function fetchSimilar(mediaId: number): Promise<MediaItem[]> {
  const page = await apiJson<Paged<MediaItem>>(`/media/${mediaId}/similar?pageSize=6`);
  return (page.items ?? []).filter((item) => item.id !== mediaId).slice(0, 5);
}
export async function fetchTrending(): Promise<MediaItem[]> {
  const page = await apiJson<Paged<MediaItem>>("/media/trending?pageSize=5");
  return (page.items ?? []).slice(0, 5);
}

/** Recommendations seeded by the first continue entry, falling back to trending. */
export async function fetchSpotlight(seed?: ContinueEntry): Promise<Spotlight> {
  if (seed) {
    const items = await fetchSimilar(seed.mediaId).catch(() => []);
    if (items.length > 0) {
      return {
        kicker: "For you",
        title: `Because you ${consumeVerb(seed.mediaType)} ${seed.media.title}.`,
        items,
      };
    }
  }

  const items = await fetchTrending().catch(() => []);
  return { kicker: "Trending", title: "Trending now.", items };
}

export function updateProgress(mediaId: number, progress: number): Promise<ContinueEntry> {
  return apiJson<ContinueEntry>(`/me/library/${mediaId}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress }),
  });
}

export function addToLibrary(item: MediaItem): Promise<unknown> {
  // External (not yet stored) items carry id 0; the API resolves them from the
  // source/id pair and stores the metadata we send.
  const identity =
    item.id > 0
      ? { mediaId: item.id }
      : { externalSource: item.externalSource, externalId: item.externalId };

  return apiJson("/me/library", {
    method: "POST",
    body: JSON.stringify({
      ...identity,
      mediaType: item.mediaType,
      status: "planning",
      title: item.title,
      coverImage: item.coverImage ?? undefined,
      year: item.year ?? undefined,
      score: item.score ?? undefined,
    }),
  });
}

function consumeVerb(mediaType: string) {
  if (mediaType === "game") return "played";
  if (mediaType === "manga") return "read";
  return "watched";
}
