import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { PageMeta } from 'lib/pages';

interface PageDialogContext {
  bountyId?: string;
  pageId?: string | null;
  readOnly?: boolean;
  toolbar?: ReactNode;
  hideToolsMenu?: boolean;
  onClose?: (page: PageMeta | null) => void;
}

interface Context {
  props: PageDialogContext;
  hidePage: (page: PageMeta | null) => void;
  showPage: (context: PageDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  props: {},
  hidePage: () => {},
  showPage: () => {}
});

export const usePageDialog = () => useContext(ContextElement);

export function PageDialogProvider ({ children }: { children: ReactNode }) {

  const [props, setProps] = useState<PageDialogContext>({});

  function hidePage (page: PageMeta | null) {
    props?.onClose?.(page);
    setProps({});
  }

  function showPage (_context: PageDialogContext) {
    setProps(_context);
  }

  const value = useMemo(() => ({
    props,
    hidePage,
    showPage
  }), [props]);

  return (
    <ContextElement.Provider value={value}>
      {children}
    </ContextElement.Provider>
  );
}
