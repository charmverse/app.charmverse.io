import type { PageType } from '@charmverse/core/prisma-client';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { useCallback, useEffect, useState } from 'react';

import type { PageHeaderValues } from 'components/[pageId]/DocumentPage/components/PageHeader';

export type NewPageValues = PageHeaderValues & {
  content: PageContent | null;
  contentText: string;
  type?: PageType;
  templateId?: string;
};

export const EMPTY_PAGE_VALUES: NewPageValues = {
  content: null,
  contentText: '',
  title: '',
  headerImage: null,
  icon: null
};

export function useNewPage() {
  const [newPageValues, setNewPageValues] = useState<null | NewPageValues>(null);
  const [isDirty, setIsDirty] = useState(false);

  // page key to reset charm editor
  const [pageKey, setPageKey] = useState('');

  function clearNewPage() {
    setNewPageValues(null);
    setIsDirty(false);
    setPageKey('');
  }

  const updateNewPageValues = useCallback((updates: Partial<NewPageValues> | null) => {
    setNewPageValues((prev) => {
      if (!prev) {
        return null;
      }

      setIsDirty(true);

      return { ...prev, ...updates };
    });
  }, []);

  const openNewPage = useCallback((defaultValues?: Partial<NewPageValues>) => {
    setNewPageValues({ ...EMPTY_PAGE_VALUES, ...defaultValues });
  }, []);

  return {
    clearNewPage,
    isDirty,
    pageKey,
    setPageKey,
    updateNewPageValues,
    newPageValues,
    openNewPage
  };
}
