import { validate } from 'uuid';

export function fancyTrim (_text: string = '', maxLength: number = 40) {
  const text = _text || '';
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

export function fancyTrimWords (_text: string = '', maxWords: number = 40) {
  const text = _text || '';
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
}

// example: https://google.com/search?q=3531422 -> https://google.com
export function getDomain (url: string, includeProtocol?: boolean) {
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

// generate a color based on a string. Copied from https://medium.com/@pppped/compute-an-arbitrary-color-for-user-avatar-starting-from-his-username-with-javascript-cd0675943b66
export function stringToColor (name: string, saturation = 50, lightness = 60) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // eslint-disable-next-line
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return `hsl(${h}, ${saturation}%, ${lightness}%)`;
}

export const shortenHex = (hex: string = '', length = 4): string => {
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
};

/**
 * Change the first character of a string to uppercase
 * Leaves other characters unchanged
 * @param input
 */
export function upperCaseFirstCharacter (input: string): string {
  if (!input) {
    return '';
  }
  const trimmed = input.trim();
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function isUUID (uuid: string) {
  return validate(uuid);
}

/**
 * Converts a list of string to human friendly gramatically correct comma list, with an and / or at the end
 * Won't add the conjunction if there is less than 2 items in the list
 */
export function humaniseList ({
  content,
  conjunction,
  capitaliseFirstCharacter
}: {
  content: string[];
  conjunction: 'and' | 'or';
  capitaliseFirstCharacter: boolean;
}): string {

  if (content.length === 1) {
    return capitaliseFirstCharacter ? upperCaseFirstCharacter(content[0]) : content[0];
  }
  else if (content.length === 0) {
    return '';
  }
  else if (content.length === 2) {
    return capitaliseFirstCharacter ? `${upperCaseFirstCharacter(content[0])} ${conjunction} ${upperCaseFirstCharacter(content[1])}`
      : `${content[0]} ${conjunction} ${content[1]}`;
  }

  const last = content.pop();
  const formatted = content.map(item => {
    if (capitaliseFirstCharacter) {
      return upperCaseFirstCharacter(item);
    }
    return item.trim();
  });
  if (formatted.length > 1) {
    formatted.push(`${conjunction} ${last}`);
  }
  else if (last) {
    formatted.push(last);
  }

  return formatted.join(', ');
}

/**
 * Append an 's' to a value's descriptor if it is not equal to 1
 * Default values will return an empty string
 */
export function conditionalPlural ({ word = '', count = 1 }: { word: string, count: number }): string {
  if (count !== 1) {
    return `${word}s`;
  }
  return word;
}

export function lowerCaseEqual (firstString?: string | null, secondString?: string | null): boolean {
  return firstString?.toLowerCase() === secondString?.toLowerCase();
}
