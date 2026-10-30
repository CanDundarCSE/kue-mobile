import { apiJson } from '@/lib/auth/session';
import { fetchCatalogPool, shuffle } from '@/lib/mini-games/pool';

export type MiniGamePoster = {
  id: number;
  mediaType: string;
  title: string;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
  externalSource?: string | null;
  externalId?: string | null;
  genres?: string[] | null;
  totalUnits?: number | null;
  unitName?: string | null;
  developer?: string | null;
};

export type MiniGameWallet = {
  balance: number;
  totalEarned: number;
};

export type DuelPair = {
  a: MiniGamePoster;
  b: MiniGamePoster;
};

export type LeaderboardEntry = {
  userId: number;
  username: string;
  avatarId?: string | null;
  totalScore: number;
  bestScore: number;
  gamesPlayed: number;
};

export type MiniGameRound = {
  mediaId: number;
  attemptsUsed: number;
  hintsUsed: string[];
  points: number;
};

type Paged<T> = { entries?: T[]; items?: T[]; mine?: LeaderboardEntry | null };

export function fetchWallet(): Promise<MiniGameWallet> {
  return apiJson<MiniGameWallet>('/me/mini-games/wallet');
}

export async function fetchPosters(
  types: string[],
  count: number,
  excludeMedia: number[] = [],
): Promise<MiniGamePoster[]> {
  const excluded = new Set(excludeMedia);
  const pool = await fetchCatalogPool(types);

  return shuffle(
    pool.filter(
      (item) =>
        item.coverImage &&
        !(typeof item.id === 'number' && item.id > 0 && excluded.has(item.id)),
    ),
  ).slice(0, count);
}

export async function fetchDuels(
  types: string[],
  count: number,
  excludeMedia: number[] = [],
): Promise<DuelPair[]> {
  const excluded = new Set(excludeMedia);
  const pool = await fetchCatalogPool(types);

  const scored = shuffle(
    pool.filter(
      (item) =>
        item.coverImage &&
        typeof item.score === 'number' &&
        !(typeof item.id === 'number' && item.id > 0 && excluded.has(item.id)),
    ),
  );

  const pairs: DuelPair[] = [];
  for (let i = 0; i + 1 < scored.length && pairs.length < count; i += 2) {
    const a = scored[i];
    const b = scored[i + 1];
    if (Math.abs((a.score ?? 0) - (b.score ?? 0)) < 0.5) continue;
    pairs.push({ a, b });
  }

  return pairs;
}

export type SprintRound = {
  media: MiniGamePoster;
  options: string[];
  answerIndex: number;
};

/** Timed genre rounds: one poster, four genres, one correct. */
export async function fetchSprint(
  types: string[],
  count: number,
  excludeMedia: number[] = [],
): Promise<SprintRound[]> {
  const excluded = new Set(excludeMedia);
  const pool = await fetchCatalogPool(types);

  const genrePool = Array.from(
    new Set(pool.flatMap((item) => item.genres ?? []).filter(Boolean)),
  );
  if (genrePool.length < 4) return [];

  const candidates = pool.filter(
    (item) =>
      item.coverImage &&
      (item.genres?.length ?? 0) > 0 &&
      !(typeof item.id === 'number' && item.id > 0 && excluded.has(item.id)),
  );

  return shuffle(candidates)
    .slice(0, count)
    .map((item): SprintRound | null => {
      const correct = item.genres?.[0];
      if (!correct) return null;

      const others = shuffle(
        genrePool.filter((genre) => genre.toLowerCase() !== correct.toLowerCase()),
      ).slice(0, 3);
      if (others.length < 3) return null;

      const options = shuffle([correct, ...others]);
      return { media: item, options, answerIndex: options.indexOf(correct) };
    })
    .filter((round): round is SprintRound => round !== null);
}

export function spendHint(hintType: string): Promise<{ balance: number }> {
  return apiJson<{ balance: number }>('/me/mini-games/wallet/spend', {
    method: 'POST',
    body: JSON.stringify({ hintType }),
  });
}

export function submitGame(payload: {
  game: string;
  scope: string[];
  rounds: MiniGameRound[];
}): Promise<{ score: number; roundsWon: number; balance: number; totalEarned: number }> {
  return apiJson('/me/mini-games/games', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchLeaderboard(
  game = 'poster-guess',
  limit = 20,
): Promise<{ entries: LeaderboardEntry[]; mine: LeaderboardEntry | null }> {
  const data = await apiJson<Paged<LeaderboardEntry>>(
    `/me/mini-games/leaderboard?game=${encodeURIComponent(game)}&limit=${limit}`,
  );

  return { entries: data.entries ?? [], mine: data.mine ?? null };
}
