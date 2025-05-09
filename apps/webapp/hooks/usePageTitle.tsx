import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export const TitleContext = createContext<[string, (title: string) => void]>(['', (title: string) => {}]);

export const usePageTitle = () => useContext(TitleContext);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const pageTitleValue: any = useState('');

  return <TitleContext.Provider value={pageTitleValue}>{children}</TitleContext.Provider>;
}

export const useStaticPageTitle = (title: string) => {
  const [, setPageTitle] = usePageTitle();
  useEffect(() => {
    setPageTitle(title);
  }, [setPageTitle, title]);
};
