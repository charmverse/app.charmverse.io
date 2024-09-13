import { customAlphabet } from 'nanoid';
import * as dictionaries from 'nanoid-dictionary';
import { validate } from 'uuid';

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

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// example: https://google.com/search?q=3531422 -> https://google.com
export function getDomain(url: string, includeProtocol?: boolean) {
  if (!url.includes('http')) {
    // invalid url, oh well
    return url;
  }
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  if (includeProtocol) {
    return `${protocol}//${host}`;
  }
  return host;
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

export function isLocalhostUrl(text: string) {
  return /^https?:\/\/(localhost|0|10|127|192(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1?\])/gi.test(text);
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

export function isUUID(uuid: string) {
  return validate(uuid);
}

const uidGenerator = customAlphabet(dictionaries.lowercase + dictionaries.numbers, 8);

// use this to generate smaller unique ids than uuid for storage
export function uid(): string {
  return uidGenerator();
}
/**
 * Converts a list of string to human friendly gramatically correct comma list, with an and / or at the end
 * Won't add the conjunction if there is less than 2 items in the list
 */
export function humaniseList({
  content,
  conjunction,
  capitaliseFirstCharacter
}: {
  content: string[];
  conjunction: 'and' | 'or';
  capitaliseFirstCharacter: boolean;
}): string {
  if (content.length === 1) {
    return capitaliseFirstCharacter ? capitalize(content[0]) : content[0];
  } else if (content.length === 0) {
    return '';
  } else if (content.length === 2) {
    return capitaliseFirstCharacter
      ? `${capitalize(content[0])} ${conjunction} ${capitalize(content[1])}`
      : `${content[0]} ${conjunction} ${content[1]}`;
  }

  const last = content.pop();
  const formatted = content.map((item) => {
    if (capitaliseFirstCharacter) {
      return capitalize(item);
    }
    return item.trim();
  });
  if (formatted.length > 1) {
    formatted.push(`${conjunction} ${last}`);
  } else if (last) {
    formatted.push(last);
  }

  return formatted.join(', ');
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

export function lowerCaseEqual(firstString?: string | null, secondString?: string | null): boolean {
  return firstString?.toLowerCase() === secondString?.toLowerCase();
}

// ref: https://stackoverflow.com/questions/6300183/sanitize-string-of-regex-characters-before-regexp-build
export function sanitizeForRegex(string: string) {
  return string.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&');
}

const emailRegexp =
  // eslint-disable-next-line max-len
  /[a-z0-9!#$%&'*+/=?^_‘{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_‘{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;

export function isValidEmail(email: string) {
  return !!email && !!email.match(emailRegexp);
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

/**
 * utility function to print an object in a readable format
 *
 * also returns object so it can be used (for example writing out to a file)
 */
export function prettyPrint(obj: any) {
  const prettified = JSON.stringify(obj, null, 2);
  // eslint-disable-next-line no-console
  console.log(prettified);

  return prettified;
}

export function stringToUint8Array(str: string): Uint8Array {
  // Create a new TextEncoder to encode the string into UTF-8
  const encoder = new TextEncoder();

  // Encode the string
  const encoded = encoder.encode(str);

  // Create a Uint8Array from the encoded string
  const uint8Array = new Uint8Array(encoded);

  return uint8Array;
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
