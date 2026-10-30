import type { MiniGamePoster } from '@/lib/api/mini-games';
import { fetchCatalogPool, shuffle } from '@/lib/mini-games/pool';

export type QuizPoster = {
  image?: string | null;
  title: string;
  mediaType: string;
  year?: number | null;
};

export type QuizQuestion = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  mediaId: number | null;
  source: 'trivia' | 'catalog';
  posters: QuizPoster[];
};

const TYPE_LABELS: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

/** OpenTDB category ids; manga shares anime's category. */
const TRIVIA_CATEGORIES: Record<string, number> = {
  movie: 11,
  series: 14,
  game: 15,
  anime: 31,
  manga: 31,
};

type TriviaItem = {
  question?: string;
  correct_answer?: string;
  incorrect_answers?: string[];
};

const NAMED_ENTITIES: Record<string, string> = {
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  eacute: 'é',
  egrave: 'è',
  uuml: 'ü',
  auml: 'ä',
  ouml: 'ö',
  copy: '©',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name] ?? match);
}

function hashQuestion(value: string) {
  let hash = 5381;
  const text = value.toLowerCase().trim();
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return `t-${hash.toString(36)}`;
}

function posterOf(item: MiniGamePoster): QuizPoster {
  return {
    image: item.coverImage ?? null,
    title: item.title,
    mediaType: item.mediaType,
    year: item.year ?? null,
  };
}

function uniqueNumbers(candidates: number[], exclude: number, count: number) {
  const out: number[] = [];
  for (const value of candidates) {
    if (value !== exclude && value > 0 && !out.includes(value) && out.length < count) {
      out.push(value);
    }
  }
  return out;
}

function yearQuestion(item: MiniGamePoster): QuizQuestion | null {
  const year = item.year;
  if (typeof year !== 'number' || !item.title) return null;

  const others = uniqueNumbers(
    [year - 1, year + 1, year - 2, year + 2, year - 5, year + 5],
    year,
    3,
  );
  if (others.length < 3) return null;

  const options = [...others, year].sort((a, b) => a - b).map(String);
  return {
    id: `g-year-${item.id ?? item.title}`,
    kind: 'year',
    prompt: `Which year was ${item.title} released?`,
    options,
    answerIndex: options.indexOf(String(year)),
    mediaId: typeof item.id === 'number' ? item.id : null,
    source: 'catalog',
    posters: [posterOf(item)],
  };
}

function genreQuestion(item: MiniGamePoster, genrePool: string[]): QuizQuestion | null {
  const correct = item.genres?.[0];
  if (!correct || !item.title) return null;

  const others = shuffle(
    genrePool.filter((genre) => genre.toLowerCase() !== correct.toLowerCase()),
  ).slice(0, 3);
  if (others.length < 3) return null;

  const options = shuffle([correct, ...others]);
  return {
    id: `g-genre-${item.id ?? item.title}`,
    kind: 'genre',
    prompt: `Which genre fits ${item.title} best?`,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: typeof item.id === 'number' ? item.id : null,
    source: 'catalog',
    posters: [posterOf(item)],
  };
}

function mediaTypeQuestion(item: MiniGamePoster): QuizQuestion | null {
  const correct = TYPE_LABELS[item.mediaType ?? ''];
  if (!correct || !item.title) return null;

  const others = shuffle(
    Object.values(TYPE_LABELS).filter((label) => label !== correct),
  ).slice(0, 3);
  const options = shuffle([correct, ...others]);

  return {
    id: `g-type-${item.id ?? item.title}`,
    kind: 'mediatype',
    prompt: `${item.title} is a…?`,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: typeof item.id === 'number' ? item.id : null,
    source: 'catalog',
    posters: [posterOf(item)],
  };
}

function unitsQuestion(item: MiniGamePoster): QuizQuestion | null {
  const total = item.totalUnits;
  const type = item.mediaType ?? '';
  if (typeof total !== 'number' || total <= 1 || !item.title) return null;
  if (type !== 'anime' && type !== 'series' && type !== 'manga') return null;

  const unit = type === 'manga' ? 'chapters' : 'episodes';
  const others = uniqueNumbers([total - 2, total + 2, total - 5, total + 5, total + 10], total, 3);
  if (others.length < 3) return null;

  const options = [...others, total].sort((a, b) => a - b).map(String);
  return {
    id: `g-units-${item.id ?? item.title}`,
    kind: 'units',
    prompt: `How many ${unit} does ${item.title} have?`,
    options,
    answerIndex: options.indexOf(String(total)),
    mediaId: typeof item.id === 'number' ? item.id : null,
    source: 'catalog',
    posters: [posterOf(item)],
  };
}

function developerQuestion(item: MiniGamePoster, developerPool: string[]): QuizQuestion | null {
  const correct = item.developer?.trim();
  if (!correct || !item.title) return null;

  const others = shuffle(
    developerPool.filter((name) => name.toLowerCase() !== correct.toLowerCase()),
  ).slice(0, 3);
  if (others.length < 3) return null;

  const options = shuffle([correct, ...others]);
  return {
    id: `g-dev-${item.id ?? item.title}`,
    kind: 'developer',
    prompt: `Who developed ${item.title}?`,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: typeof item.id === 'number' ? item.id : null,
    source: 'catalog',
    posters: [posterOf(item)],
  };
}

function catalogQuestions(pool: MiniGamePoster[]): QuizQuestion[] {
  const genrePool = Array.from(
    new Set(pool.flatMap((item) => item.genres ?? []).filter(Boolean)),
  );
  const developerPool = Array.from(
    new Set(
      pool
        .map((item) => item.developer?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  );

  const questions: QuizQuestion[] = [];
  pool.forEach((item) => {
    const question =
      yearQuestion(item) ??
      unitsQuestion(item) ??
      mediaTypeQuestion(item) ??
      (developerPool.length >= 4 ? developerQuestion(item, developerPool) : null) ??
      (genrePool.length >= 4 ? genreQuestion(item, genrePool) : null);
    if (question) questions.push(question);
  });
  return questions;
}

async function fetchTrivia(categories: number[], amount: number): Promise<QuizQuestion[]> {
  const results = await Promise.all(
    categories.map(async (category) => {
      try {
        const response = await fetch(
          `https://opentdb.com/api.php?amount=${amount}&category=${category}&type=multiple&encode=url3986`,
        );
        if (!response.ok) return [];
        const data = (await response.json().catch(() => null)) as {
          response_code?: number;
          results?: TriviaItem[];
        } | null;
        if (!data || data.response_code !== 0 || !Array.isArray(data.results)) return [];

        return data.results
          .map((item): QuizQuestion | null => {
            const prompt = decodeEntities(
              decodeURIComponent(item.question ?? ''),
            ).trim();
            const correct = decodeEntities(
              decodeURIComponent(item.correct_answer ?? ''),
            ).trim();
            const wrong = (item.incorrect_answers ?? []).map((answer) =>
              decodeEntities(decodeURIComponent(answer)).trim(),
            );
            if (!prompt || !correct || wrong.length !== 3 || wrong.some((value) => !value)) {
              return null;
            }
            const options = shuffle([correct, ...wrong]);
            return {
              id: hashQuestion(prompt),
              kind: 'trivia',
              prompt,
              options,
              answerIndex: options.indexOf(correct),
              mediaId: null,
              source: 'trivia',
              posters: [],
            };
          })
          .filter((question): question is QuizQuestion => question !== null);
      } catch {
        return [];
      }
    }),
  );

  return results.flat();
}

/** Builds a mixed quiz: catalog facts first, plus OpenTDB trivia when reachable. */
export async function fetchQuiz(
  types: string[],
  count: number,
  excludeQuestionIds: string[] = [],
  excludeMedia: number[] = [],
): Promise<QuizQuestion[]> {
  const excludedMedia = new Set(excludeMedia);
  const excludedQuestions = new Set(excludeQuestionIds);

  const pool = (await fetchCatalogPool(types)).filter(
    (item) => !(typeof item.id === 'number' && item.id > 0 && excludedMedia.has(item.id)),
  );

  const catalog = shuffle(catalogQuestions(pool)).filter(
    (question) => !excludedQuestions.has(question.id),
  );

  const categories = Array.from(
    new Set(
      (types.length > 0 ? types : Object.keys(TRIVIA_CATEGORIES)).map(
        (type) => TRIVIA_CATEGORIES[type] ?? 11,
      ),
    ),
  );

  const trivia = (await fetchTrivia(categories, count)).filter(
    (question) => !excludedQuestions.has(question.id),
  );

  const mixed: QuizQuestion[] = [];
  const max = Math.max(catalog.length, trivia.length);
  for (let i = 0; i < max && mixed.length < count; i += 1) {
    if (i < catalog.length) mixed.push(catalog[i]);
    if (i < trivia.length && mixed.length < count) mixed.push(trivia[i]);
  }

  return mixed.slice(0, count);
}
