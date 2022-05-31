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

export const shortenHex = (hex: string, length = 4): string => {
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
};

// copied from react-router to support focalboard

function invariant (cond: any, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

/**
 * Returns a path with params interpolated.
 *
 * @see https://reactrouter.com/docs/en/v6/api#generatepath
 */
export function generatePath (path: string, params: any = {}): string {
  const remainingParamsKeys = { ...params };
  return path
    .replace(/\[(\w+)\]/g, (_, key) => {
      invariant(params[key] != null, `Missing ":${key}" param`);
      delete remainingParamsKeys[key];
      return params[key]!;
    })
    .replace(/\/*\*$/, _ => params['*'] == null ? '' : params['*'].replace(/^\/*/, '/'));
}

/**
 * Change the first character of a string to uppercase
 * Leaves other characters unchanged
 * @param input
 */
export function upperCaseFirstCharacter (input: string): string {
  const trimmed = input.trim();
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function isUUID (uuid: string) {
  return validate(uuid);
}
