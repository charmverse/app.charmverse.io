import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Stack, Tooltip } from '@mui/material';
import type { Board, IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { mutator } from '@packages/databases/mutator';
import { useRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { useTrashPages } from 'charmClient/hooks/pages';
import Link from 'components/common/Link';
import { useSnackbar } from 'hooks/useSnackbar';

import IconButton from '../../widgets/buttons/iconButton';
import AddViewMenu from '../addViewMenu';
import { ViewFilterControl } from '../ViewFilterControl';
import { ViewSettingsRow } from '../ViewSettingsRow';
import { ViewSortControl } from '../ViewSortControl';

import NewCardButton from './newCardButton';
import { ToggleViewSidebarButton } from './ToggleViewSidebarButton';
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu';
import { ViewHeaderRowsMenu } from './ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import ViewHeaderSearch from './viewHeaderSearch';
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

  async function addCardFromTemplate(card: Card) {
    const [blocks] = await mutator.duplicateCard({
      board: activeBoard as Board,
      card
    });
    const newPageId = blocks[0].id;
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
      if (property && !property.readOnly) {
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
              {withSortBy && <ViewSortControl activeBoard={activeBoard} activeView={activeView} cards={cards} />}
            </>
          )}

          <ViewHeaderSearch />

          {/* Link to view embedded table in full - check that at least one view is created */}
          {props.embeddedBoardPath && !!views.length && (
            <Link href={`/${props.embeddedBoardPath}`}>
              <IconButton
                tooltip='Open as full page'
                icon={<OpenInFullIcon color='secondary' sx={{ fontSize: 14 }} />}
                style={{ width: '32px' }}
              />
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
                  addCardFromTemplate={addCardFromTemplate}
                  addCardTemplate={props.addCardTemplate}
                  showCard={props.showCard}
                  deleteCardTemplate={deleteCardTemplate}
                  templatesBoard={activeBoard}
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
