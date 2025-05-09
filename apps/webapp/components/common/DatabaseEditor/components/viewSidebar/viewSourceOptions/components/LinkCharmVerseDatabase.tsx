import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import { useMemo, useState } from 'react';

import type { PageListItem } from 'components/common/PagesList';
import { PagesList } from 'components/common/PagesList';
import { usePages } from 'hooks/usePages';

import { allowedSourceDatabasePageTypes } from '../useSourceOptions';

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

type Props = {
  currentSourceDatabaseId?: string;
  onSelectLinkedDatabase: (data: { pageId: string; pageTitle: string }) => void;
  placeholder?: string;
  pages?: PageListItem[];
};

export function LinkCharmVerseDatabase(props: Props) {
  const { pages } = usePages();
  const [searchTerm, setSearchTerm] = useState('');

  const sortedPages = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (props.pages ?? Object.values(pages))
      .filter(
        (p) =>
          allowedSourceDatabasePageTypes.includes(p?.type || '') &&
          p?.title?.toLowerCase().includes(lowerCaseSearchTerm)
      )
      .filter(isTruthy)
      .sort((pageA, pageB) => ((pageA.title || 'Untitled') > (pageB.title || 'Untitled') ? 1 : -1));
  }, [pages, props.pages, searchTerm]);

  return (
    <SidebarContent data-test='linked-database-options'>
      <TextField
        data-test='linked-database-search'
        autoFocus
        placeholder={props.placeholder ?? 'Search pages'}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        sx={{
          mb: 1
        }}
        fullWidth
      />
      <PagesList
        emptyText='No databases found'
        pages={sortedPages}
        activePageId={props.currentSourceDatabaseId}
        onSelectPage={(pageId, _, __, pageTitle) => props.onSelectLinkedDatabase({ pageId, pageTitle })}
        style={{
          height: '250px',
          overflow: 'auto'
        }}
      />
    </SidebarContent>
  );
}
