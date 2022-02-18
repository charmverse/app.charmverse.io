import { ReactNode, createContext, useContext, useMemo, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from './useCurrentSpace';

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

  const [space] = useCurrentSpace();
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  useEffect(() => {
    if (space) {
      setPages([]);
      charmClient.getPages(space.id)
        .then(_pages => {
          setPages(_pages);
        });
    }
  }, [space]);

  const value = useMemo(() => ({ currentPage, pages, setCurrentPage, setPages }), [currentPage, pages]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
