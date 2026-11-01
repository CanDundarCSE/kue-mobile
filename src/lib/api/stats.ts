import { apiJson } from '@/lib/auth/session';

export type StatsOverview = {
  totalItems: number;
  totalCompleted: number;
  totalInProgress: number;
  totalPlanned: number;
  totalDropped: number;
  totalOnHold: number;
  totalFavorites: number;
  movie?: { total: number };
  series?: { total: number };
  game?: { total: number };
  anime?: { total: number };
  manga?: { total: number };
};

export type StatsTimeSpent = {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  animeMinutes: number;
  seriesMinutes: number;
  movieMinutes: number;
  gamesCompleted: number;
  mangaChaptersRead: number;
};

export type GenreStat = {
  genre: string;
  count: number;
  percentage: number;
};

export type ActivityDay = {
  date: string;
  added: number;
  completed: number;
  total?: number;
};

export function fetchStatsOverview(): Promise<StatsOverview> {
  return apiJson<StatsOverview>('/me/stats/overview');
}

export function fetchTimeSpent(): Promise<StatsTimeSpent> {
  return apiJson<StatsTimeSpent>('/me/stats/time-spent');
}

export async function fetchGenreStats(): Promise<GenreStat[]> {
  const data = await apiJson<{ items?: GenreStat[] }>('/me/stats/genres');
  return data.items ?? [];
}

export async function fetchActivityStats(days = 182): Promise<ActivityDay[]> {
  const data = await apiJson<{ dailySummaries?: ActivityDay[] }>(
    `/me/stats/activity?days=${days}`,
  );
  return data.dailySummaries ?? [];
}
