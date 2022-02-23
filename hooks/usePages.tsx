import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { useCurrentSpace } from './useCurrentSpace';

type IContext = {
  currentPage: Page | null,
  pages: Page[],
  setCurrentPage: Dispatch<SetStateAction<Page | null>>,
  setPages: Dispatch<SetStateAction<Page[]>>,
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
};

export const PagesContext = createContext<Readonly<IContext>>({
  currentPage: null,
  pages: [],
  setCurrentPage: () => undefined,
  setPages: () => undefined,
  isEditing: true,
  setIsEditing: () => { }
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
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

  const value = useMemo(() => ({
    currentPage,
    isEditing,
    setIsEditing,
    pages,
    setCurrentPage,
    setPages
  }), [currentPage, isEditing, pages, setPages, setCurrentPage, setIsEditing]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
