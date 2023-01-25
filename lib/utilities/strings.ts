import type { UserWallet } from '@prisma/client';
import { utils } from 'ethers';
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
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  );
  return urlPattern.test(text);
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
export function stringToValidPath(input: string, maxLength?: number): string {
  const sanitizedInput = input
    .slice(0, maxLength)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(
      /[^a-zA-Z\d\s\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u2605-\u2606\u2190-\u2195\u203B]{1,}/g,
      ' '
    )
    .trim()
    .replace(/\s{1,}/g, '_');

  if (sanitizedInput.length < 3) {
    return `${sanitizedInput}_${uid()}`;
  } else {
    return sanitizedInput;
  }
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

// use this to generate smaller unique ids than uuid for storage
export function uid() {
  return Math.round(Date.now() + Math.random() * 1000).toString(36);
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

  if (utils.isAddress(string)) {
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
