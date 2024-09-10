export function assertNotUndefined<T>(value: T | undefined, message: string): asserts value is T {
  if (value === undefined) {
    throw new Error(`assertion failed: ${message}`);
  }
}

/**
 * Creates an object from an array of [key, Value], filtering out any
 * undefined or null key
 */
export function createObject<T>(entries: [string | null | undefined, T][]): {
  [k: string]: T;
} {
  return Object.fromEntries(entries.filter((e) => e[0] != null));
}

class MatchType {
  // eslint-disable-next-line no-useless-constructor
  constructor(public start: number, public end: number, public match: boolean, private _sourceString: string) {
    // no-op
  }

  get subString() {
    return this._sourceString.slice(this.start, this.end);
  }
}
/**
 *
 * Returns an array of objects which contains a range of substring and whether it matched or didn't match.
 * Note: each item in this array will map 1:1 in order with the original string in a way
 *  such that following will always hold true:
 * ```
 * const result = matchAllPlus(regex, myStr);
 * result.reduce((a, b) => a + b.subString) === myStr
 * result.reduce((a, b) => a + b.slice(b.start, b.end)) === myStr
 * ```
 */
export function matchAllPlus(regexp: RegExp, str: string): MatchType[] {
  const result: MatchType[] = [];
  let prevElementEnd = 0;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = regexp.exec(str))) {
    const curStart = match.index;
    const curEnd = curStart + match[0]!.length;
    if (prevElementEnd !== curStart) {
      result.push(new MatchType(prevElementEnd, curStart, false, str));
    }
    result.push(new MatchType(curStart, curEnd, true, str));
    prevElementEnd = curEnd;
  }
  if (result.length === 0) {
    return [new MatchType(0, str.length, false, str)];
  }

  const lastItemEnd = result[result.length - 1] && result[result.length - 1]!.end;

  if (lastItemEnd && lastItemEnd !== str.length) {
    result.push(new MatchType(lastItemEnd, str.length, false, str));
  }
  return result;
}
