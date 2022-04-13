// useful for filtering null values out of a list so it compiles
export const isTruthy = <T>(t: T | false | undefined | null | void): t is T => Boolean(t);
