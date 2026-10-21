import { KueColors } from "@/constants/kue-theme";

export type MediaType = "movie" | "series" | "game" | "anime" | "manga";

export type LandingStatus =
  | "watching"
  | "playing"
  | "reading"
  | "hold"
  | "done"
  | "watched"
  | "unwatched";

export type LandingRow = {
  id: string;
  type: MediaType;
  title: string;
  image?: string;
  year: number;
  current: number;
  total: number;
  unit: string;
  status: LandingStatus;
  score: number;
};

export type ActivityHeatmapItem = {
  date: string;
  added?: number;
  completed?: number;
};

export const MEDIA_TYPE_META: Record<MediaType, { label: string; color: string }> = {
  movie: { label: "Film", color: KueColors.movie },
  series: { label: "Series", color: KueColors.series },
  game: { label: "Games", color: KueColors.game },
  anime: { label: "Anime", color: KueColors.anime },
  manga: { label: "Manga", color: KueColors.manga },
};

export const COVERS: Record<string, string> = {
  "Frieren: Beyond Journey's End":
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg",
  "Elden Ring": "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
  "Alan Wake 2": "https://images.igdb.com/igdb/image/upload/t_cover_big/co6jar.jpg",
  Severance: "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
  Berserk: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30002-Cul4OeN7bYtn.jpg",
  Parasite: "https://image.tmdb.org/t/p/w500/nx7TmJDMkgyBc09DVo5ze52Wt3F.jpg",
  Vagabond: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30656-9mW113O7rDnA.png",
};

export const MOCK_ROWS: LandingRow[] = [
  {
    id: "frieren",
    type: "anime",
    title: "Frieren: Beyond Journey's End",
    image: COVERS["Frieren: Beyond Journey's End"],
    year: 2023,
    current: 18,
    total: 28,
    unit: "ep",
    status: "watching",
    score: 9.6,
  },
  {
    id: "elden-ring",
    type: "game",
    title: "Elden Ring",
    image: COVERS["Elden Ring"],
    year: 2022,
    current: 84,
    total: 150,
    unit: "h",
    status: "playing",
    score: 8.4,
  },
  {
    id: "severance",
    type: "series",
    title: "Severance",
    image: COVERS.Severance,
    year: 2022,
    current: 9,
    total: 19,
    unit: "ep",
    status: "watching",
    score: 8.2,
  },
  {
    id: "berserk",
    type: "manga",
    title: "Berserk",
    image: COVERS.Berserk,
    year: 1989,
    current: 246,
    total: 374,
    unit: "ch",
    status: "reading",
    score: 9.8,
  },
  {
    id: "parasite",
    type: "movie",
    title: "Parasite",
    image: COVERS.Parasite,
    year: 2019,
    current: 1,
    total: 1,
    unit: "film",
    status: "watched",
    score: 9.4,
  },
  {
    id: "vagabond",
    type: "manga",
    title: "Vagabond",
    image: COVERS.Vagabond,
    year: 1998,
    current: 140,
    total: 327,
    unit: "ch",
    status: "hold",
    score: 9.7,
  },
  {
    id: "alan-wake-2",
    type: "game",
    title: "Alan Wake 2",
    image: COVERS["Alan Wake 2"],
    year: 2022,
    current: 10,
    total: 10,
    unit: "h",
    status: "done",
    score: 9.5,
  },
];

export const MEDIA_FORMATS: {
  type: MediaType;
  label: string;
  name: string;
  value: number;
  decimals: number;
  suffix: string;
  source: string;
  copy: string;
}[] = [
  { type: "movie", label: "Film", name: "Movies", value: 1.3, decimals: 1, suffix: "M+", source: "TMDB", copy: "One tap when the credits roll." },
  { type: "series", label: "Series", name: "TV Series", value: 200, decimals: 0, suffix: "K+", source: "TMDB", copy: "Follow along, episode by episode." },
  { type: "game", label: "Games", name: "Video Games", value: 370, decimals: 0, suffix: "K+", source: "IGDB", copy: "The backlog finally has a home." },
  { type: "anime", label: "Anime", name: "Anime", value: 20, decimals: 0, suffix: "K+", source: "AniList", copy: "New episode tonight? Log it and move on." },
  { type: "manga", label: "Manga", name: "Manga", value: 100, decimals: 0, suffix: "K+", source: "AniList", copy: "Long runs stay countable." },
];

export const SYNC_SOURCES: { name: string; scope: string; count: string }[] = [
  { name: "TMDB", scope: "films · series", count: "1.5M+ titles" },
  { name: "AniList", scope: "anime · manga", count: "120K+ entries" },
  { name: "IGDB", scope: "games", count: "370K+ games" },
];

export const GENRE_PULL = ["RPG ×27", "Seinen ×19", "Drama ×14", "Sci-Fi ×11"];

export const TIME_SPENT = (() => {
  const MINUTES_PER_ANIME_EPISODE = 24;
  const MINUTES_PER_SERIES_EPISODE = 45;
  const DEFAULT_MOVIE_MINUTES = 105;

  let anime = 0;
  let series = 0;
  let film = 0;

  for (const row of MOCK_ROWS) {
    if (row.type === "anime") anime += row.current * MINUTES_PER_ANIME_EPISODE;
    else if (row.type === "series") series += row.current * MINUTES_PER_SERIES_EPISODE;
    else if (row.type === "movie" && row.status === "watched") film += DEFAULT_MOVIE_MINUTES;
  }

  const ranked = [
    { label: "Anime", minutes: anime },
    { label: "Series", minutes: series },
    { label: "Film", minutes: film },
  ].sort((a, b) => b.minutes - a.minutes);
  const top = ranked[0].minutes || 1;

  return ranked.map((entry) => ({
    label: entry.label,
    hours: Math.round((entry.minutes / 60) * 10) / 10,
    share: Math.round((entry.minutes / top) * 100),
  }));
})();

export const LIBRARY_SUMMARY = (() => {
  let episodes = 0;
  let chapters = 0;
  let scoreTotal = 0;

  for (const row of MOCK_ROWS) {
    if (row.type === "anime" || row.type === "series") episodes += row.current;
    if (row.type === "manga") chapters += row.current;
    scoreTotal += row.score;
  }

  return {
    episodes,
    chapters,
    meanScore: Math.round((scoreTotal / MOCK_ROWS.length) * 10) / 10,
  };
})();

export const LANDING_RAMP = [
  KueColors.surface3,
  "rgba(241, 241, 237, 0.16)",
  "rgba(241, 241, 237, 0.36)",
  "rgba(241, 241, 237, 0.62)",
  KueColors.accent,
];

const MS_PER_DAY = 86_400_000;
export const LANDING_TODAY = Math.floor(Date.now() / MS_PER_DAY) * MS_PER_DAY;

function pseudoRandom(seed: number) {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function buildActivity(): ActivityHeatmapItem[] {
  const items: ActivityHeatmapItem[] = [];

  for (let back = 200; back >= 0; back--) {
    const day = LANDING_TODAY - back * MS_PER_DAY;
    const week = Math.floor(day / (7 * MS_PER_DAY));
    const energy = 0.15 + pseudoRandom(week * 31 + 7) * 0.75;
    const addedRoll = pseudoRandom(day);
    const completedRoll = pseudoRandom(day + 977);
    const added = addedRoll < energy ? 0 : 1 + (Math.floor(addedRoll * 100) % 3);
    const completed = completedRoll < 0.88 ? 0 : 1;

    if (added === 0 && completed === 0) continue;

    items.push({ date: new Date(day).toISOString().slice(0, 10), added, completed });
  }

  return items;
}

export const ACTIVITY = buildActivity();

export const ACTIVITY_SUMMARY = (() => {
  const activeDays = new Set(ACTIVITY.map((item) => item.date)).size;
  const busiest = new Map<string, number>();

  for (const item of ACTIVITY) {
    const month = item.date.slice(0, 7);
    busiest.set(month, (busiest.get(month) ?? 0) + (item.added ?? 0) + (item.completed ?? 0));
  }

  let streak = 0;
  let longest = 0;
  for (let back = 0; back <= 200; back++) {
    const iso = new Date(LANDING_TODAY - back * MS_PER_DAY).toISOString().slice(0, 10);
    if (ACTIVITY.some((item) => item.date === iso)) {
      streak += 1;
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
  }

  const busiestMonth = [...busiest.entries()].sort((a, b) => b[1] - a[1])[0][0];

  return {
    activeDays,
    longestStreak: longest,
    busiestMonth: new Date(`${busiestMonth}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      timeZone: "UTC",
    }),
  };
})();
