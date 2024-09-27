import type { ReactNode } from 'react';

export type UnnestObjValue<T> = T extends {
  [k: string]: infer U;
}
  ? U
  : never;

// use this instead of React.PropsWithChildren to require children
export type PropsWithChildren<P = unknown> = P & { children: ReactNode };
