import type { Question, Topic } from '../types';
import { normalizeLanguage } from './languages';

type QuestionTranslation = {
  id: string;
  text: string;
  options: string[];
};

const CACHE_PREFIX = 'quiz_translations_v1';
const MAX_BATCH = 20;

function getQuestionKey(topic: Topic, question: Question, index: number) {
  const id = question.id;
  if (typeof id === 'number') return `${topic}-${id}`;
  if (typeof id === 'string' && id.trim().length > 0) return id;
  return `${topic}-${index + 1}`;
}

function getCacheKey(lang: string, topic: Topic) {
  return `${CACHE_PREFIX}:${lang}:${topic}`;
}

function readCache(lang: string, topic: Topic): Record<string, QuestionTranslation> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getCacheKey(lang, topic));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, QuestionTranslation>;
  } catch {
    return {};
  }
  return {};
}

function writeCache(lang: string, topic: Topic, data: Record<string, QuestionTranslation>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getCacheKey(lang, topic), JSON.stringify(data));
  } catch {
    // Ignore cache failures (e.g., quota)
  }
}

function isValidTranslation(item: any): item is QuestionTranslation {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    Array.isArray(item.options) &&
    item.options.length === 4 &&
    item.options.every((o: any) => typeof o === 'string')
  );
}

async function fetchTranslations(
  lang: string,
  topic: Topic
): Promise<Record<string, QuestionTranslation>> {
  const response = await fetch(`/i18n/questions/${lang}/${topic}.json`, { cache: 'force-cache' });
  if (!response.ok) {
    return {};
  }
  const data = await response.json();
  const items = Array.isArray(data) ? data : [];
  const merged: Record<string, QuestionTranslation> = {};
  for (const item of items) {
    if (isValidTranslation(item)) {
      merged[item.id] = item;
    }
  }
  return merged;
}

export async function localizeQuestions(topic: Topic, lang: string, baseQuestions: Question[]) {
  const normalized = normalizeLanguage(lang);
  if (normalized === 'es') return baseQuestions;

  const cache = readCache(normalized, topic);
  const missing: QuestionTranslation[] = [];
  const mapped = baseQuestions.map((q, index) => {
    const key = getQuestionKey(topic, q, index);
    const cached = cache[key];
    if (!cached) {
      missing.push({ id: key, text: q.text, options: q.options });
      return q;
    }
    return { ...q, text: cached.text, options: cached.options };
  });

  if (missing.length === 0) return mapped;

  try {
    const translated = await fetchTranslations(normalized, topic);
    const updatedCache = { ...cache, ...translated };
    writeCache(normalized, topic, updatedCache);

    return baseQuestions.map((q, index) => {
      const key = getQuestionKey(topic, q, index);
      const tr = updatedCache[key];
      if (!tr) return q;
      return { ...q, text: tr.text, options: tr.options };
    });
  } catch (error) {
    console.error('Translation error:', error);
    return baseQuestions;
  }
}
