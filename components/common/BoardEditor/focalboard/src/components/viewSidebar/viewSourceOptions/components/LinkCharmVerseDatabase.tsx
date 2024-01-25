import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { useMemo, useState } from 'react';

import { PagesList } from 'components/common/PagesList';
import { usePages } from 'hooks/usePages';
import { isTruthy } from 'lib/utilities/types';

import { allowedSourceDatabasePageTypes } from '../useSourceOptions';

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

type Props = {
  currentSourceDatabaseId?: string;
  onSelectLinkedDatabase: (data: { sourceDatabaseId: string }) => void;
};

export function LinkCharmVerseDatabase(props: Props) {
  const { pages } = usePages();
  const [searchTerm, setSearchTerm] = useState('');

  const sortedPages = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return Object.values(pages)
      .filter(
        (p) =>
          allowedSourceDatabasePageTypes.includes(p?.type || '') &&
          p?.title?.toLowerCase().includes(lowerCaseSearchTerm)
      )
      .filter(isTruthy)
      .sort((pageA, pageB) => ((pageA.title || 'Untitled') > (pageB.title || 'Untitled') ? 1 : -1));
  }, [pages, searchTerm]);

  return (
    <SidebarContent data-test='linked-database-options'>
      <TextField
        data-test='linked-database-search'
        autoFocus
        placeholder='Search pages'
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
        onSelectPage={(pageId) => props.onSelectLinkedDatabase({ sourceDatabaseId: pageId })}
        style={{
          height: '250px',
          overflow: 'auto'
        }}
      />
    </SidebarContent>
  );
}
