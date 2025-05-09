import { createContext, useContext, useMemo } from 'react';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export function ColorModeProvider({
  toggleColorMode,
  children
}: {
  toggleColorMode: () => void;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      toggleColorMode
    }),
    [toggleColorMode]
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}
