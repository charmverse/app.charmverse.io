// useful for filtering null values out of a list so it compiles
export const isTruthy = <T>(t: T | false | undefined | null | void): t is T => Boolean(t);

// Ensure all properties in T are defined, and not null
// Combine with Typescript Pick<T> to require a subset of keys from a type
export type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

// a generic type to replace all date properties with strings
export type JSONValues<T> = {
  [P in keyof T]: P extends string ? (T[P] extends Date ? string : T[P]) : never;
};

type PickNullable<T> = {
  [P in keyof T as null extends T[P] ? P : never]: T[P];
};

type PickNotNullable<T> = {
  [P in keyof T as null extends T[P] ? never : P]: T[P];
};

// make all nullable values optional. source: https://stackoverflow.com/questions/72165227/how-to-make-nullable-properties-optional-in-typescript
export type OptionalNullable<T> = T extends any[]
  ? OptionalNullable<T[number]>[]
  : T extends object
    ? {
        [K in keyof PickNullable<T>]?: OptionalNullable<T[K]>;
      } & {
        [K in keyof PickNotNullable<T>]: OptionalNullable<T[K]>;
      }
    : T;

// export type RequiredFields<T, K extends keyof T> = {
//   T in K;
//   [P in K]-?: T[P];
// };
