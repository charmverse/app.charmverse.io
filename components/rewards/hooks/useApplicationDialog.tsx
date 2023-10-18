import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type Context = {
  currentApplicationId: string | null;
  isOpen: boolean;
  hideApplication: () => void;
  showApplication: (applicationId: string) => void;
  createApplication: () => void;
};

const ContextElement = createContext<Readonly<Context>>({
  currentApplicationId: null,
  isOpen: false,
  hideApplication: () => {},
  showApplication: () => {},
  createApplication: () => {}
});

export const useApplicationDialog = () => useContext(ContextElement);

export function ApplicationDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);

  function hideApplication() {
    setCurrentApplicationId(null);
    setIsOpen(false);
  }

  function showApplication(_applicationId: string) {
    setCurrentApplicationId(_applicationId);
    setIsOpen(true);
  }

  function createApplication() {
    setCurrentApplicationId(null);
    setIsOpen(true);
  }

  const value = useMemo(
    () => ({
      currentApplicationId,
      isOpen,
      showApplication,
      hideApplication,
      createApplication
    }),
    [isOpen, currentApplicationId]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
