import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

interface PageDialogContext {
  bountyId?: string;
  pageId?: string | null;
  readOnly?: boolean;
  toolbar?: ReactNode;
  hideToolsMenu?: boolean;
}

interface Context extends PageDialogContext {
  onCloseDialog?: () => void;
  hidePage: () => void;
  showPage: (context: PageDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  hidePage: () => {},
  showPage: () => {}
});

export const usePageDialog = () => useContext(ContextElement);

export function PageDialogProvider ({ children }: { children: ReactNode }) {

  const [context, setContext] = useState<PageDialogContext>({});

  function hidePage () {
    setContext({});
  }

  function showPage (_context: PageDialogContext) {
    setContext(_context);
  }

  const value = useMemo(() => ({
    ...context,
    hidePage,
    showPage
  }), [context]);

  return (
    <ContextElement.Provider value={value}>
      {children}
    </ContextElement.Provider>
  );
}
