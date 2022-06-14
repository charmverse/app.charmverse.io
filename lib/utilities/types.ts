// useful for filtering null values out of a list so it compiles
export const isTruthy = <T>(t: T | false | undefined | null | void): t is T => Boolean(t);

// Ensure all properties in T are defined, and not null
// Combine with Typescript Pick<T> to require a subset of keys from a type
export type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>
}
