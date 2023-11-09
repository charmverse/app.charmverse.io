import type { PageType } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { PageHeaderValues } from 'components/[pageId]/DocumentPage/components/PageHeader';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type NewPageValues = PageHeaderValues & {
  content: PageContent | null;
  contentText: string;
};

type NewPageContext = {
  clearNewPage: () => void;
  hasNewPage: boolean;
  pageKey: string;
  setPageKey: (key: string) => void;
  newPageValues: NewPageValues | null;
  updateNewPageValues: (updates: Partial<NewPageValues> | null) => void;
  openNewPage: (initValues?: NewPageValues) => void;
  isDirty: boolean;
};

const EMPTY_PAGE_VALUES = {
  content: null,
  contentText: '',
  title: '',
  headerImage: null,
  icon: null
};

export function useNewPage(): NewPageContext {
  const [newPageValues, setNewPageValues] = useState<null | NewPageValues>(null);
  const [isDirty, setIsDirty] = useState(false);

  // page key to reset charm editor
  const [pageKey, setPageKey] = useState('');

  function clearNewPage() {
    setNewPageValues(null);
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

  const openNewPage = useCallback((initValues?: NewPageValues) => {
    setNewPageValues(initValues || EMPTY_PAGE_VALUES);
  }, []);

  return {
    clearNewPage,
    hasNewPage,
    pageKey,
    setPageKey,
    updateNewPageValues,
    newPageValues,
    openNewPage,
    isDirty
  };
}
