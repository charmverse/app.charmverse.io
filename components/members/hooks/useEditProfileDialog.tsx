import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface Context {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  isOpen: false,
  setIsOpen: () => {}
});

export const useEditProfileDialog = () => useContext(ContextElement);

export function EditProfileProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen
    }),
    [isOpen]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
