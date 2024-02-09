import type { PageMeta } from '@charmverse/core/pages';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Stack, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { useTrashPages } from 'charmClient/hooks/pages';
import { ViewFilterControl } from 'components/common/BoardEditor/components/ViewFilterControl';
import { ViewSettingsRow } from 'components/common/BoardEditor/components/ViewSettingsRow';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Link from 'components/common/Link';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import { mutator } from '../../mutator';
import { useAppSelector } from '../../store/hooks';
import IconButton from '../../widgets/buttons/iconButton';
import AddViewMenu from '../addViewMenu';

import NewCardButton from './newCardButton';
import { ToggleViewSidebarButton } from './ToggleViewSidebarButton';
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu';
import { ViewHeaderRowsMenu } from './ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import ViewTabs from './viewTabs';

type Props = {
  activeBoard?: Board;
  activeView?: BoardView;
  views: BoardView[];
  viewsBoard: Board; // the parent board which keeps track of the views on this page
  cards: Card[];
  addCard: () => void;
  showCard: (cardId: string | null) => void;
  // addCardFromTemplate: (cardTemplateId: string) => void
  addCardTemplate: () => void;
  readOnly: boolean;
  dateDisplayProperty?: IPropertyTemplate;
  disableUpdatingUrl?: boolean;
  maxTabsShown?: number;
  onClickNewView?: () => void;
  onDeleteView?: (viewId: string) => void;
  showActionsOnHover?: boolean;
  showView: (viewId: string) => void;
  embeddedBoardPath?: string;
  toggleViewOptions: (open?: boolean) => void;
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
};

function ViewHeader(props: Props) {
  const router = useRouter();
  const { pages, refreshPage } = usePages();
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });
  const { trigger: trashPages } = useTrashPages();
  const { showError } = useSnackbar();
  const views = props.views.filter((view) => !view.fields.inline);

  const {
    maxTabsShown = 3,
    showView,
    toggleViewOptions,
    viewsBoard,
    activeBoard,
    onClickNewView,
    activeView,
    cards,
    dateDisplayProperty,
    checkedIds = [],
    setCheckedIds
  } = props;

  const withDisplayBy = activeView?.fields.viewType === 'calendar';
  const withSortBy = activeView?.fields.viewType !== 'calendar';

  async function addPageFromTemplate(pageId: string) {
    const [blocks] = await mutator.duplicateCard({
      board: activeBoard as Board,
      cardId: pageId,
      cardPage: pages[pageId] as PageMeta
    });
    const newPageId = blocks[0].id;
    await refreshPage(newPageId);
    props.showCard(newPageId);
  }

  async function deleteCardTemplate(pageId: string) {
    try {
      await trashPages({ pageIds: [pageId], trash: true });
    } catch (error) {
      showError(error);
    }
  }

  const propertyTemplates: IPropertyTemplate<PropertyType>[] = [];

  if (activeView?.fields?.visiblePropertyIds.length) {
    activeView.fields.visiblePropertyIds.forEach((propertyId) => {
      const property = activeBoard?.fields.cardProperties.find((p) => p.id === propertyId);
      if (property) {
        propertyTemplates.push(property);
      }
    });
  } else {
    activeBoard?.fields.cardProperties.forEach((property) => {
      propertyTemplates.push(property);
    });
  }

  const showViewHeaderRowsMenu = checkedIds.length !== 0 && setCheckedIds && activeBoard;

  return (
    <Stack gap={0.75}>
      <div
        key={viewsBoard.id}
        className={`ViewHeader ${showViewHeaderRowsMenu ? 'view-header-rows-menu-visible' : ''} ${
          props.showActionsOnHover ? 'hide-actions' : ''
        }`}
      >
        {showViewHeaderRowsMenu ? (
          <div style={{ marginBottom: 4 }}>
            <ViewHeaderRowsMenu
              board={activeBoard}
              cards={cards}
              checkedIds={checkedIds}
              setCheckedIds={setCheckedIds}
              propertyTemplates={propertyTemplates}
            />
          </div>
        ) : (
          <>
            <ViewTabs
              onDeleteView={props.onDeleteView}
              onClickNewView={onClickNewView}
              board={viewsBoard}
              views={views}
              readOnly={props.readOnly}
              showView={showView}
              activeView={activeView}
              disableUpdatingUrl={props.disableUpdatingUrl}
              maxTabsShown={maxTabsShown}
              openViewOptions={() => toggleViewOptions(true)}
            />

            {/* add a view */}

            {!props.readOnly && views.length <= maxTabsShown && (
              <Box className='view-actions' pt='4px'>
                <AddViewMenu
                  board={viewsBoard}
                  activeView={activeView}
                  views={views}
                  showView={showView}
                  onClick={onClickNewView}
                />
              </Box>
            )}
          </>
        )}
        <div className='octo-spacer' />

        <Box className='view-actions'>
          {!props.readOnly && activeView && (
            <>
              {/* Display by */}

              {withDisplayBy && (
                <ViewHeaderDisplayByMenu
                  properties={activeBoard?.fields.cardProperties ?? []}
                  activeView={activeView}
                  dateDisplayPropertyName={dateDisplayProperty?.name}
                />
              )}

              {/* Filter */}
              <ViewFilterControl activeBoard={activeBoard} activeView={activeView} />

              {/* Sort */}
              {withSortBy && (
                <ViewSortControl
                  activeBoard={activeBoard}
                  activeView={activeView}
                  cards={cards}
                  viewSortPopup={viewSortPopup}
                />
              )}
            </>
          )}

          {/* Search - disabled until we can access page data inside the redux selector */}

          {/* <ViewHeaderSearch/> */}

          {/* Link to view embedded table in full - check that at least one view is created */}
          {props.embeddedBoardPath && !!views.length && (
            <Link href={`/${router.query.domain}/${props.embeddedBoardPath}`}>
              <Tooltip title='Open as full page' placement='top'>
                <span>
                  <IconButton
                    icon={<OpenInFullIcon color='secondary' sx={{ fontSize: 14 }} />}
                    style={{ width: '32px' }}
                  />
                </span>
              </Tooltip>
            </Link>
          )}

          {/* Options menu */}

          {!props.readOnly && activeView && (
            <>
              <ToggleViewSidebarButton onClick={() => toggleViewOptions()} />

              {/* New card button */}

              {activeBoard?.fields.sourceType !== 'proposals' && (
                <NewCardButton
                  addCard={props.addCard}
                  addCardFromTemplate={addPageFromTemplate}
                  addCardTemplate={props.addCardTemplate}
                  showCard={props.showCard}
                  deleteCardTemplate={deleteCardTemplate}
                  templatesBoardId={activeBoard?.id}
                />
              )}
            </>
          )}
        </Box>
      </div>

      {activeView && <ViewSettingsRow sx={{ mx: 0 }} activeView={activeView} canSaveGlobally />}
    </Stack>
  );
}

export default React.memo(ViewHeader);
