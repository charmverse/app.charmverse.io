
import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Add } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import Button from 'components/common/Button';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { usePages } from 'hooks/usePages';
import { createBoardView } from 'lib/focalboard/boardView';
import log from 'lib/log';
import { isTruthy } from 'lib/utilities/types';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BoardSelection from './BoardSelection';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div`

  .BoardComponent {
    overflow: visible;
  }

  .container-container {
    min-width: unset;
    overflow-x: auto;
    padding: 0;
    // offset padding around document
    margin: 0 -24px;
    padding-left: 24px;
    ${({ theme }) => theme.breakpoints.up('md')} {
      margin: 0 -80px;
      padding-left: 80px;
    }
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;

    // Hide calculations footer
    .CalculationRow {
      display: none;
    }
  }

  // remove extra padding on Kanban view
  .octo-board-header {
    padding-top: 0;
  }

  // remove extra margin on calendar view
  .fc .fc-toolbar.fc-header-toolbar {
    margin-top: 0;
  }

  // adjust columns on Gallery view
  @media screen and (min-width: 600px) {
    .Gallery {
      padding-right: 48px; // offset the left padding from .container-container
      ${({ theme }) => theme.breakpoints.up('md')} {
        padding-right: 80px;
      }
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .GalleryCard {
      width: auto;
    }
  }
`;

interface DatabaseViewProps extends NodeViewProps {
  readOnly?: boolean;
}

interface DataSource {
  pageId: string;
  viewId: string;
  source: 'board_page';
  title: string | null
}

const MAX_DATA_SOURCES = 2;

export default function DatabaseView ({ readOnly: readOnlyOverride, node, updateAttrs }: DatabaseViewProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>(node.attrs.dataSources);

  const shownDataSources = dataSources.slice(0, MAX_DATA_SOURCES);
  const hiddenDataSources = dataSources.slice(MAX_DATA_SOURCES);
  const showHiddenDataSourcesPopupState = usePopupState({ variant: 'popover', popupId: 'show-data-sources-popup' });
  const showHiddenDataSourcesTriggerState = bindTrigger(showHiddenDataSourcesPopupState);
  const showHiddenDataSourcesMenuState = bindMenu(showHiddenDataSourcesPopupState);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Keep track of which board is currently being viewed
  const [currentDataSourceIndex, setCurrentDataSourceIndex] = useState<number>(dataSources.length !== 0 ? 0 : -1);
  const [isSelectingSource, setIsSelectingSource] = useState(false);

  const currentDataSource = currentDataSourceIndex !== -1 ? dataSources[currentDataSourceIndex] : null;
  const boards = useAppSelector(getSortedBoards);
  // Always display the first page and view
  const viewId = currentDataSource?.viewId;
  const pageId = currentDataSource?.pageId;

  const board = boards.find(b => b.id === pageId);
  const cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: pageId || '',
    viewId: viewId || ''
  }));
  const allViews = useAppSelector(getSortedViews);
  const boardViews = allViews.filter(view => view.parentId === pageId);
  const activeView = useAppSelector(getView(viewId || ''));
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, getPagePermissions } = usePages();
  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const boardPages = Object.values(pages).filter(p => p?.type === 'board').filter(isTruthy);
  const accessibleCards = cards.filter(card => pages[card.id]);

  const currentPagePermissions = getPagePermissions(pageId || '');

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  async function selectBoard (boardId: string) {
    const view = createBoardView();
    view.fields.viewType = 'board';
    view.parentId = boardId;
    view.rootId = boards.find(_board => _board.id === boardId)?.rootId ?? boardId;
    view.title = 'Board view';
    // A new property to indicate that this view was creating for inline databases only
    view.fields.inline = true;

    await mutator.insertBlock(view);
    const newDataSource: DataSource = { pageId: boardId, viewId: view.id, source: 'board_page', title: pages[boardId]?.title || null };
    const newDataSources = [...dataSources, newDataSource];
    setDataSources(newDataSources);
    setIsSelectingSource(false);
    setCurrentDataSourceIndex(Math.min(newDataSources.length, MAX_DATA_SOURCES - 1));
  }

  useEffect(() => {
    updateAttrs({
      dataSources
    });
  }, [dataSources]);

  if (!board || isSelectingSource) {
    return (
      <BoardSelection
        pages={boardPages}
        onSelect={selectBoard}
        onClickBack={() => {
          setIsSelectingSource(false);
        }}
      />
    );
  }

  function deleteDataSource () {
    // TODO: Ideally we would also delete the actual view, as it can't be referenced anywhere anymore
    setAnchorEl(null);
    const leftDataSources = dataSources.filter(
      dataSource => (dataSource.pageId !== currentDataSource?.pageId) || (dataSource.viewId !== currentDataSource?.viewId)
    );
    setDataSources(leftDataSources);
    setCurrentDataSourceIndex(leftDataSources.length !== 0 ? leftDataSources.length - 1 : -1);
  }

  // If there are no active view then auto view creation process didn't work as expected
  if (!activeView) {
    return null;
  }

  let property = groupByProperty;
  if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
    property = board?.fields.cardProperties.find((o: any) => o.type === 'select');
  }

  let displayProperty = dateDisplayProperty;
  if (!displayProperty && activeView.fields.viewType === 'calendar') {
    displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  const readOnly = typeof readOnlyOverride === 'undefined' ? currentPagePermissions.edit_content !== true : readOnlyOverride;

  return (
    <>
      <StylesContainer className='focalboard-body'>
        <Box sx={{
          '.top-head': {
            padding: 0
          },
          '.MuiTypography-root': {
            textDecoration: 'none'
          },
          '.MuiTypography-root:hover': {
            textDecoration: 'none'
          }
        }}
        >
          <CenterPanel
            hideBanner
            viewTabs={(
              <Box display='flex' gap={1}>
                <Tabs textColor='primary' indicatorColor='secondary' value={`${pageId}.${viewId}`} sx={{ minHeight: 40 }}>
                  {shownDataSources.map((dataSource, dataSourceIndex) => {
                    const _board = boards.find(b => b.id === dataSource.pageId);
                    return _board ? (
                      <Tab
                        component='div'
                        disableRipple
                        key={`${dataSource.pageId}.${dataSource.viewId}`}
                        label={(
                          <Button
                            variant='text'
                            startIcon={<PageIcon icon={pages[dataSource.pageId]?.icon} pageType='board' isEditorEmpty={false} />}
                            color={(pageId === dataSource.pageId && viewId === dataSource.viewId) ? 'textPrimary' : 'secondary'}
                            sx={{ px: 1.5 }}
                            onClick={(e: any) => {
                              // Show the datasource menu
                              if (currentDataSource?.pageId === dataSource.pageId && currentDataSource?.viewId === dataSource.viewId) {
                                setAnchorEl(e.currentTarget);
                              }
                              else {
                                setCurrentDataSourceIndex(dataSourceIndex);
                              }
                            }}
                          >
                            {dataSource.title ?? _board.title}
                          </Button>
                        )}
                        sx={{ p: 0 }}
                        value={`${dataSource.pageId}.${dataSource.viewId}`}
                      />
                    ) : null;
                  })}
                  {hiddenDataSources.length !== 0 && (
                    <Tab
                      component='div'
                      disableRipple
                      label={(
                        <Button
                          variant='text'
                          size='small'
                          color='secondary'
                          {...showHiddenDataSourcesTriggerState}
                        >
                          {hiddenDataSources.length} more...
                        </Button>
                      )}
                    />
                  )}
                </Tabs>
                {hiddenDataSources.length === 0 && (
                <IconButton
                  sx={{
                    width: 'fit-content',
                    height: 'fit-content',
                    position: 'relative',
                    top: 3
                  }}
                  onClick={() => {
                    setIsSelectingSource(true);
                  }}
                  color='secondary'
                  size='small'
                >
                  <Add fontSize='small' />
                </IconButton>
                )}
              </Box>
            )}
            showHeader
            hideViewTabs
            clientConfig={clientConfig}
            readonly={readOnly}
            board={board}
            setPage={(p) => {
              log.warn('Ignoring update page properties of inline database', p);
            }}
            cards={accessibleCards}
            showCard={showCard}
            activeView={activeView}
            groupByProperty={property}
            dateDisplayProperty={displayProperty}
            views={boardViews}
          />
        </Box>
        <Menu
          {...showHiddenDataSourcesMenuState}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 1
          }}
          >
            {hiddenDataSources.map((dataSource, dataSourceIndex) => {
              const _board = boards.find(b => b.id === dataSource.pageId);
              return _board ? (
                <MenuItem
                  component='a'
                  key={`${dataSource.pageId}.${dataSource.viewId}`}
                  dense
                  onClick={() => {
                    const edgeDataSource = dataSources[MAX_DATA_SOURCES - 1];
                    dataSources[MAX_DATA_SOURCES - 1] = dataSource;
                    dataSources[MAX_DATA_SOURCES + dataSourceIndex] = edgeDataSource;
                    setDataSources([...dataSources]);
                    showHiddenDataSourcesMenuState.onClose();
                    setCurrentDataSourceIndex(MAX_DATA_SOURCES - 1);
                  }}
                >
                  <PageIcon icon={pages[dataSource.pageId]?.icon} pageType='board' isEditorEmpty={false} />
                  <ListItemText>{dataSource.title ?? _board.title}</ListItemText>
                </MenuItem>
              ) : null;
            })}
          </Box>
          <Divider />
          <Button
            sx={{
              width: '100%'
            }}
            color='secondary'
            size='small'
            startIcon={<Add />}
            variant='text'
            onClick={() => {
              setIsSelectingSource(true);
              showHiddenDataSourcesMenuState.onClose();
              setCurrentDataSourceIndex(MAX_DATA_SOURCES - 1);
            }}
          >
            Add source
          </Button>
        </Menu>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => {
            setAnchorEl(null);
          }}
        >
          <MenuItem dense onClick={() => {}}>
            <ListItemIcon><EditIcon fontSize='small' /></ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            dense
            onClick={deleteDataSource}
          >
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </StylesContainer>
      {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
        <RootPortal>
          <CardDialog
            key={shownCardId}
            cardId={shownCardId}
            onClose={() => showCard(undefined)}
            showCard={(cardId) => showCard(cardId)}
            readonly={readOnly}
          />
        </RootPortal>
      )}
      <FocalBoardPortal />
    </>
  );
}
