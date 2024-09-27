// use this instead of React.PropsWithChildren to require children
import type { ReactNode } from 'react';

export type PropsWithChildren<P = unknown> = P & { children: ReactNode };
