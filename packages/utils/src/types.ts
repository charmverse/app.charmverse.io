// useful for filtering null values out of a list so it compiles
export const isTruthy = <T>(t: T | false | undefined | null | void): t is T => Boolean(t);

/**
 * Object.keys with inbuilt typing
 */
export function typedKeys<T>(obj: T): (keyof T)[] {
  return Object.keys(obj ?? {}) as (keyof T)[];
}

export type UnnestObjValue<T> = T extends {
  [k: string]: infer U;
}
  ? U
  : never;

// a generic type to replace all date properties with strings
export type JSONValues<T> = {
  [P in keyof T]: P extends string ? (T[P] extends Date ? string : T[P]) : never;
};

// Ensure all properties in T are defined, and not null
// Combine with Typescript Pick<T> to require a subset of keys from a type
export type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

// Mark fields that we dont need to send to the frotnend (booleans, nulls and empty strings) as optional
export type OptionalFalseyFields<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K] | undefined
    : T[K] extends boolean
      ? T[K] | undefined
      : null extends T[K]
        ? T[K] | undefined
        : T[K];
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
