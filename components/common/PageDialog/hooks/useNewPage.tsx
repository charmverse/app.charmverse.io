import type { PageType } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { PageHeaderValues } from 'components/[pageId]/DocumentPage/components/PageHeader';
import type { PageContent } from 'lib/prosemirror/interfaces';

type NewPageValues = PageHeaderValues & {
  content: PageContent | null;
  contentText: string;
};

type NewPageProps = {
  disabledTooltip?: string;
  readOnlyEditor?: boolean;
  editorPlaceholder?: string;
  type?: PageType;
  contentUpdated?: boolean;
};

type NewPageContext = {
  updateNewPageContext: (context: Partial<NewPageProps> | null) => void;
  newPageContext: NewPageProps;
  clearNewPage: () => void;
  hasNewPage: boolean;
  pageKey: string;
  setPageKey: (key: string) => void;
  newPageValues: NewPageValues | null;
  updateNewPageValues: (updates: Partial<NewPageValues> | null) => void;
  openNewPage: (initValues?: NewPageValues) => void;
  isDirty: boolean;
};

const EMPTY_PAGE_CONTEXT = {
  disabledTooltip: '',
  readOnlyEditor: false,
  editorPlaceholder: undefined,
  type: undefined,
  contentUpdated: false
};

const EMPTY_PAGE_VALUES = {
  content: null,
  contentText: '',
  title: '',
  headerImage: null,
  icon: null
};

const Context = createContext<Readonly<NewPageContext>>({
  updateNewPageContext: () => {},
  newPageContext: EMPTY_PAGE_CONTEXT,
  clearNewPage: () => {},
  hasNewPage: false,
  pageKey: '',
  setPageKey: () => {},
  newPageValues: null,
  updateNewPageValues: () => {},
  openNewPage: () => {},
  isDirty: false
});

export const useNewPage = () => useContext(Context);

export function NewPageProvider({ children }: { children: ReactNode }) {
  const [newPageValues, setNewPageValues] = useState<null | NewPageValues>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [newPageContext, setNewPageContext] = useState<NewPageProps>(EMPTY_PAGE_CONTEXT);
  // page key to reset charm editor
  const [pageKey, setPageKey] = useState('');

  function clearNewPage() {
    setNewPageValues(null);
    setNewPageContext(EMPTY_PAGE_CONTEXT);
  }

  const hasNewPage = !!newPageValues;

  useEffect(() => {
    if (!hasNewPage) {
      setPageKey('');
      clearNewPage();
    }
  }, [hasNewPage]);

  const updateNewPageValues = useCallback((updates: Partial<NewPageValues> | null) => {
    setNewPageValues((prev) => {
      if (!prev) {
        return null;
      }

      setIsDirty(true);

      return { ...prev, ...updates };
    });
  }, []);

  const updateNewPageContext = useCallback((updatedContext: Partial<NewPageProps> | null) => {
    if (!updatedContext) {
      return;
    }

    setNewPageContext((prev) => {
      return { ...prev, ...updatedContext };
    });
  }, []);

  const openNewPage = useCallback((initValues?: NewPageValues) => {
    setNewPageValues(initValues || EMPTY_PAGE_VALUES);
  }, []);

  const value = useMemo(
    () => ({
      newPageContext,
      updateNewPageContext,
      clearNewPage,
      hasNewPage,
      pageKey,
      setPageKey,
      updateNewPageValues,
      newPageValues,
      openNewPage,
      isDirty
    }),
    [
      hasNewPage,
      isDirty,
      newPageContext,
      newPageValues,
      openNewPage,
      pageKey,
      updateNewPageContext,
      updateNewPageValues
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
