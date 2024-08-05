import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

export interface PageDialogContext {
  bountyId?: string;
  pageId?: string | null;
  readOnly?: boolean;
  hideToolsMenu?: boolean;
  onClose?: () => void;
  applicationId?: string;
}

interface Context {
  props: PageDialogContext;
  hidePage: () => void;
  showPage: (context: PageDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  props: {},
  hidePage: () => {},
  showPage: () => {}
});

export const usePageDialog = () => useContext(ContextElement);

export function PageDialogProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<PageDialogContext>({});

  function hidePage() {
    props?.onClose?.();
    setProps({});
  }

  function showPage(_context: PageDialogContext) {
    setProps(_context);
  }

  const value = useMemo(
    () => ({
      props,
      hidePage,
      showPage
    }),
    [props]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
