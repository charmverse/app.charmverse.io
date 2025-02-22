import { log } from '@charmverse/core/log';
import { init } from '@paralleldrive/cuid2';
import { validate } from 'uuid';

/**
 * Change the first character of a string to uppercase
 * Leaves other characters unchanged
 * @param input
 */
export function capitalize(input?: string): string {
  if (!input) {
    return '';
  }
  const trimmed = input.trim();
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function concatenateStringValues(obj: Record<string, any>): string[] {
  const stringValues = Object.keys(obj).reduce((acc: string[], key) => {
    const value = obj[key];

    if (typeof value === 'string') {
      acc.push(value);
    } else if (Array.isArray(value)) {
      const arrayOfStrings = value.filter((item) => typeof item === 'string');
      if (arrayOfStrings.length > 0) {
        acc.push(arrayOfStrings.join(', '));
      }
    }

    return acc;
  }, []);

  return stringValues;
}

const emailRegexp =
  // eslint-disable-next-line max-len
  /[a-z0-9!#$%&'*+/=?^_‘{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_‘{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;

export function isValidEmail(email: string) {
  return !!email && !!email.match(emailRegexp);
}
export function isUrl(text: string) {
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    if (!url.hostname.includes('.')) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export const getFilenameWithExtension = (path: string, fallbackExtension = 'jpg'): string => {
  const pathParts = path.split('/');
  const rawName = pathParts.pop() || '';
  const [name, extension] = rawName.split('.');

  return `${pathParts.join('/')}/${name}.${extension?.toLowerCase() || fallbackExtension}`;
};

// ref: https://stackoverflow.com/questions/6300183/sanitize-string-of-regex-characters-before-regexp-build
export function sanitizeForRegex(string: string) {
  return string.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&');
}

// from https://stackoverflow.com/questions/23305000/javascript-fuzzy-search-that-makes-sense
// https://gist.github.com/mavaddat/a522c2ed59162d6330569999cab03d76
export function stringSimilarity(str1?: string, str2?: string, gramSize: number = 2) {
  function getNGrams(s: string, len: number) {
    s = ' '.repeat(len - 1) + s.toLowerCase() + ' '.repeat(len - 1);
    const v = new Array(s.length - len + 1);
    for (let i = 0; i < v.length; i++) {
      v[i] = s.slice(i, i + len);
    }
    return v;
  }

  if (!str1?.length || !str2?.length) {
    return 0.0;
  }

  const s1 = str1.length < str2.length ? str1 : str2;
  const s2 = str1.length < str2.length ? str2 : str1;

  const pairs1 = getNGrams(s1, gramSize);
  const pairs2 = getNGrams(s2, gramSize);
  const set = new Set<string>(pairs1);

  const total = pairs2.length;
  let hits = 0;
  for (const item of pairs2) {
    if (set.delete(item)) {
      hits += 1;
    }
  }
  return hits / total;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * If plural is provided, this word will be returned in case count is not equal to 1. Otherwise, the word will be returned with an 's' appended
 */
type ConditionalPlural = { word: string; count: number; plural?: string };

/**
 * Append an 's' to a value's descriptor if it is not equal to 1
 * Default values will return an empty string
 */
export function conditionalPlural({ word = '', count = 1, plural }: ConditionalPlural): string {
  if (count !== 1) {
    return plural ?? `${word}s`;
  }
  return word;
}

export function fancyTrim(_text: string = '', maxLength: number = 40) {
  const text = _text || '';
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

export function fancyTrimWords(_text: string = '', maxWords: number = 40) {
  const text = _text || '';
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
}

export function prettyPrint(input: any): string {
  const pretty =
    typeof input === 'object'
      ? JSON.stringify(input, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
      : input?.toString
        ? input.toString()
        : input;

  log.info(pretty);

  return pretty;
}

export function isUUID(uuid: string) {
  return validate(uuid);
}

// generate a color based on a string. Copied from https://medium.com/@pppped/compute-an-arbitrary-color-for-user-avatar-starting-from-his-username-with-javascript-cd0675943b66
export function stringToColor(name: string, saturation = 50, lightness = 60) {
  if (name === '') {
    // return 'var(--background-dark)';
    return 'transparent';
  }
  return `hsl(${stringToHue(name)}, ${saturation}%, ${lightness}%)`;
}

export function stringToHue(name: string) {
  const cleanName = name.replace('0x', ''); // ignore the universal prefix of addresses
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    // eslint-disable-next-line
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return h;
}

export function lowerCaseEqual(firstString?: string | null, secondString?: string | null): boolean {
  return firstString?.toLowerCase() === secondString?.toLowerCase();
}

// A future update can use https://www.npmjs.com/package/friendly-url
// Info for japanese title characters: https://gist.github.com/ryanmcgrath/982242
export function stringToValidPath({
  input,
  maxLength,
  wordSeparator = '_',
  autoReplaceEmpty = true
}: {
  input: string;
  maxLength?: number;
  wordSeparator?: string;
  autoReplaceEmpty?: boolean;
}): string {
  const sanitizedInput = input
    .slice(0, maxLength)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(
      /[^a-zA-Z\d\s\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u2605-\u2606\u2190-\u2195\u203B]{1,}/g,
      ' '
    )
    .trim()
    .replace(/\s{1,}/g, wordSeparator);

  if (sanitizedInput.length < 3 && autoReplaceEmpty) {
    return `${sanitizedInput}${wordSeparator}${uid()}`;
  } else {
    return sanitizedInput;
  }
}

// a short id, shorter than a uid
export function uid() {
  const generator = init({
    length: 8
  });
  return generator();
}

/**
 * Create by default a cuid with length 10
 */
export const randomString = init({
  length: 10
});
