import { ReactNode, createContext, useContext, useMemo, Dispatch, SetStateAction } from 'react';
import { Page } from 'models';
import { pages as pagesSeed } from 'seedData';
import { useLocalStorage } from './useLocalStorage';

type IContext = {
  currentPage: Page | null,
  pages: Page[],
  setCurrentPage: Dispatch<SetStateAction<Page | null>>,
  setPages: Dispatch<SetStateAction<Page[]>>
};

export const PagesContext = createContext<Readonly<IContext>>({
  currentPage: null,
  pages: [],
  setCurrentPage: () => undefined,
  setPages: () => undefined
});

export function PagesProvider ({ children }: { children: ReactNode }) {

  const [pages, setPages] = useLocalStorage<Page[]>('pages', pagesSeed);
  const [currentPage, setCurrentPage] = useLocalStorage<Page | null>('currentPage', null);

  const value = useMemo(() => ({ currentPage, pages, setCurrentPage, setPages }), [currentPage, pages]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
