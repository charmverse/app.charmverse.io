import { createContext, useContext, useEffect, useState } from 'react';

export const TitleContext = createContext(['', () => {}]);

export const useTitleState = () => useContext(TitleContext);

export function PageTitleProvider ({ children }: { children: React.ReactNode }) {

  const pageTitleValue: any = useState('');

  return <TitleContext.Provider value={pageTitleValue}>
    {children}
  </TitleContext.Provider>;
}

export const setTitle = (title: string) => {

  const [_, setTitleValue] = useTitleState();
  useEffect(() => {
    (setTitleValue as ((title: string) => void))(title);
  }, []);
};