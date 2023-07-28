import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { ListItemIcon, MenuItem, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { getBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import PagesList from 'components/common/CharmEditor/components/PageList';
import { usePages } from 'hooks/usePages';
import type { Board } from 'lib/focalboard/board';
import type { BoardView, BoardViewFields } from 'lib/focalboard/boardView';
import { isTruthy } from 'lib/utilities/types';

export type DatabaseSourceProps = {
  onCreate?: () => Promise<BoardView>;
  onSelect: (source: Pick<BoardViewFields, 'linkedSourceId' | 'sourceData' | 'sourceType'>, boardBlock?: Board) => void;
};

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

const databasePageTypes = ['board', 'inline_board'];

export function CharmVerseDatabasesSource(props: DatabaseSourceProps & { activePageId?: string }) {
  const { pages } = usePages();
  const [searchTerm, setSearchTerm] = useState('');

  const boards = useAppSelector(getBoards);
  const sortedPages = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return Object.values(pages)
      .filter((p) => databasePageTypes.includes(p?.type || '') && p?.title.toLowerCase().includes(lowerCaseSearchTerm))
      .filter(isTruthy)
      .sort((pageA, pageB) => ((pageA.title || 'Untitled') > (pageB.title || 'Untitled') ? 1 : -1));
  }, [pages, searchTerm]);

  function onSelect(pageId: string) {
    const boardBlock = boards[pageId];
    props.onSelect(
      {
        linkedSourceId: pageId,
        sourceType: 'board_page'
      },
      boardBlock
    );
  }
  return (
    <>
      <SidebarContent>
        <TextField
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
          activePageId={props.activePageId}
          onSelectPage={onSelect}
          style={{
            height: '250px',
            overflow: 'auto'
          }}
        />
      </SidebarContent>
      {props.onCreate && (
        <MenuItem onClick={props.onCreate}>
          <ListItemIcon>
            <AddIcon color='secondary' />
          </ListItemIcon>
          <Typography variant='body2' color='secondary'>
            New database
          </Typography>
        </MenuItem>
      )}
    </>
  );
}
