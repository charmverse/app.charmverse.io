import type { UserWallet } from '@charmverse/core/prisma-client';
import { validate } from 'uuid';
import { isAddress } from 'viem';

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

export const shortenHex = (hex: string = '', length = 4): string => {
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
};

/**
 * Change the first character of a string to uppercase
 * Leaves other characters unchanged
 * @param input
 */
export function capitalize(input: string): string {
  if (!input) {
    return '';
  }
  const trimmed = input.trim();
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function isUUID(uuid: string) {
  return validate(uuid);
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

/**
 * Shortens valid wallet addresses, leaves other strings unchanged
 */
export function shortWalletAddress(string?: string): string {
  if (!string) {
    return '';
  }

  if (isAddress(string)) {
    return shortenHex(string).toLowerCase();
  }

  return string;
}

/**
 * Tie a wallet address to a short address, or its mixed case format
 */
export function matchWalletAddress(
  address1: string,
  address2: string | Pick<UserWallet, 'address' | 'ensname'>
): boolean {
  if (!address1 || !address2) {
    return false;
  }
  const ensname = typeof address2 === 'string' ? null : address2.ensname;

  if (ensname === address1) {
    return true;
  }

  const baseAddress = typeof address2 === 'string' ? address2 : address2.address;

  return shortWalletAddress(address1) === shortWalletAddress(baseAddress);
}
const emailRegexp =
  // eslint-disable-next-line max-len
  /[a-z0-9!#$%&'*+/=?^_‘{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_‘{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;

export function isValidEmail(email: string) {
  return !!email && !!email.match(emailRegexp);
}

export function tsQueryLanguageCharacters() {
  return [' ', '&', '|', '!', '<->', '<N>', '(', ')', ':', '*', "'"];
}

// Postgres uses the following characters as special characters for text search. If provided as part of the search input, they throw an error
// Although \s is a special character, it is excluded here since manually handled by the escape method
export function tsQueryLanguageSpecialCharacterRegexp() {
  // eslint-disable-next-line no-useless-escape
  return /[&|!\(\):*']|(<->)|<N>/g;
}

export function escapeTsQueryCharactersAndFormatPrismaSearch(text: string): string | undefined {
  if (!text) {
    return undefined;
  }

  const formattedSearch = text.replace(tsQueryLanguageSpecialCharacterRegexp(), '').trim();

  if (formattedSearch) {
    return `${formattedSearch
      .split(/\s/)
      .filter((s) => s)
      .join(' & ')}:*`;
  } else {
    return undefined;
  }
}

export function sortUuids(uuids: string[]): string[] {
  return uuids.sort((a, b) => a.localeCompare(b));
}
