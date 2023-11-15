import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useCharmRouter } from 'hooks/useCharmRouter';
import { isUUID } from 'lib/utilities/strings';

export interface PageDialogContext {
  bountyId?: string;
  pageId?: string | null;
  readOnly?: boolean;
  hideToolsMenu?: boolean;
  onClose?: () => void;
  applicationId?: string;
  isNewApplication?: boolean;
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
  const {
    router: { query },
    updateURLQuery
  } = useCharmRouter();

  useEffect(() => {
    setProps((prevProps) => ({
      ...prevProps,
      // application props based on router query rather than explicit showing / hiding dialog
      applicationId:
        query.applicationId && isUUID(query.applicationId as string) ? (query.applicationId as string) : undefined,
      isNewApplication: query.applicationId === 'new',
      pageId: query.id && isUUID(query.id as string) ? (query.id as string) : undefined
    }));
  }, [query]);

  function hidePage() {
    props?.onClose?.();
    setProps({});

    const { applicationId, isNewApplication, id, ...rest } = query;
    updateURLQuery(rest, true);
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
