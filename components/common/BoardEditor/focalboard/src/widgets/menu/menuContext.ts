import { createContext, useContext } from 'react';

export type Context = [HTMLDivElement | null, (ref: HTMLDivElement | null) => void]

export const MenuContext = createContext<Context>([null, () => void 0]);

export const useMenuContext = () => useContext(MenuContext);
