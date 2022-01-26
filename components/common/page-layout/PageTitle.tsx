import { createContext, useContext, useEffect } from 'react';

export const TitleContext = createContext(['', () => {}]);

export const useTitleState = () => useContext(TitleContext);

export const setTitle = (title: string) => {

  const [_, setTitleValue] = useTitleState();
  useEffect(() => {
    (setTitleValue as ((title: string) => void))(title);
  }, []);
};