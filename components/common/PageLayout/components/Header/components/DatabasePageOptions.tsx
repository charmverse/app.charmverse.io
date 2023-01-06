import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import VerticalAlignBottomOutlinedIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { Divider, Tooltip } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import type { ChangeEventHandler } from 'react';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import charmClient from 'charmClient';
import { sendFlashMessage } from 'components/common/BoardEditor/focalboard/src/components/flashMessages';
import { CsvExporter } from 'components/common/BoardEditor/focalboard/src/csvExporter';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import type { CardPage } from 'components/common/BoardEditor/focalboard/src/store/cards';
import {
  getViewCardsSortedFilteredAndGrouped,
  sortCards
} from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useToggleFavorite } from 'hooks/useToggleFavorite';
import { useUser } from 'hooks/useUser';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { createCard } from 'lib/focalboard/card';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import {
  createCardFieldProperties,
  createNewPropertiesForBoard,
  deepMergeArrays,
  isValidCsvResult,
  mapCardBoardProperties
} from './utils/databasePageOptions';

interface Props {
  closeMenu: () => void;
  pageId: string;
  pagePermissions?: IPagePermissionFlags;
}

function onExportCsvTrigger(board: Board, activeView: BoardView, cards: Card[], intl: IntlShape) {
  try {
    CsvExporter.exportTableCsv(board, activeView, cards, intl);
    const exportCompleteMessage = intl.formatMessage({
      id: 'ViewHeader.export-complete',
      defaultMessage: 'Export complete!'
    });
    sendFlashMessage({ content: exportCompleteMessage, severity: 'normal' });
  } catch (e) {
    const exportFailedMessage = intl.formatMessage({
      id: 'ViewHeader.export-failed',
      defaultMessage: 'Export failed!'
    });
    sendFlashMessage({ content: exportFailedMessage, severity: 'high' });
  }
}

export default function DatabaseOptions({ pagePermissions, closeMenu, pageId }: Props) {
  const intl = useIntl();
  const router = useRouter();
  const { pages, deletePage } = usePages();
  const view = useAppSelector(getView(router.query.viewId as string));
  const boards = useAppSelector(getSortedBoards);
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId });
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const { user } = useUser();
  const currentSpace = useCurrentSpace();

  const activeBoardId = view?.fields.sourceData?.boardId ?? view?.fields.linkedSourceId ?? view?.rootId;
  const board = boards.find((b) => b.id === activeBoardId);

  if (!board || !view) {
    return null;
  }

  const cards = useAppSelector(
    getViewCardsSortedFilteredAndGrouped({
      boardId: board.id,
      viewId: view.id
    })
  );
  const cardPages: CardPage[] = cards
    .map((card) => ({ card, page: pages[card.id] }))
    .filter((item): item is CardPage => !!item.page);

  const sortedCardPages = sortCards(cardPages, board, view, members);

  async function onDeletePage() {
    await deletePage({
      pageId
    });
    closeMenu();
  }

  const exportCsv = () => {
    const _cards = sortedCardPages.map(({ card, page }) => {
      return {
        ...card,
        // update the title from correct model
        title: page.title
      };
    });

    onExportCsvTrigger(board, view, _cards, intl);
    closeMenu();
    const spaceId = pages[pageId]?.spaceId;
    if (spaceId) {
      charmClient.track.trackAction('export_page_csv', { pageId, spaceId });
    }
  };

  function onCopyLink() {
    Utils.copyTextToClipboard(window.location.href);
    showMessage('Copied link to clipboard', 'success');
    closeMenu();
  }

  const addNewCards = async (results: Papa.ParseResult<Record<string, string>>) => {
    const csvData = results.data;
    const headers = results.meta.fields || [];

    // Remove name property because it is not an option
    const allAvailableProperties = headers.filter((header) => header !== 'Name');

    const mappedInitialBoardProperties = mapCardBoardProperties(board.fields.cardProperties);

    // Create card properties for the board
    const newBoardProperties = allAvailableProperties.map((prop) =>
      createNewPropertiesForBoard(csvData, prop, mappedInitialBoardProperties[prop])
    );

    /**
     * Merge the fields of both boards.
     * The order is important here. The old board should be last so it can overwrite the important properties.
     */
    const mergedFields = deepMergeArrays(newBoardProperties, board.fields.cardProperties);

    // Create the new board and update the db
    const newBoardBlock: Board = {
      ...board,
      fields: {
        ...board.fields,
        cardProperties: mergedFields
      }
    };

    // Update board with new cardProperties
    await charmClient.updateBlock(newBoardBlock);

    // Create the new mapped board properties to know what are the ids of each property and option
    const mappedBoardProperties = mapCardBoardProperties(mergedFields);

    if (!user || !currentSpace || !board) {
      throw new Error('An error occured while importing. Please verify you have a valid user, space and board.');
    }

    // Create the new card blocks from the csv data
    const blocks = csvData
      .map((csvRow) => {
        // Show the first text column as a title if no Name column is in the csv
        const firstTextId = newBoardBlock.fields.cardProperties.find((prop) => prop.type === 'text')?.id;
        const fieldProperties = createCardFieldProperties(csvRow, mappedBoardProperties, members);
        const text = firstTextId ? fieldProperties[firstTextId] : undefined;
        const textName = text && typeof text === 'string' ? text : '';

        const card = createCard({
          parentId: board.id,
          rootId: board.id,
          createdBy: user.id,
          updatedBy: user.id,
          spaceId: currentSpace.id,
          title: csvRow.Name || textName,
          fields: {
            properties: fieldProperties
          }
        });

        return card;
      })
      .flat();

    // Add new cards
    await charmClient.insertBlocks(blocks, () => null);
  };

  const importCsv: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        worker: event.target.files[0].size > 100000, // 100kb
        delimiter: '\n', // fallback for a csv with 1 column
        complete: async (results) => {
          closeMenu();
          if (results.errors && results.errors[0]) {
            showMessage(results.errors[0].message ?? 'There was an error importing your csv file.', 'warning');
            return;
          }
          if (isValidCsvResult(results)) {
            await addNewCards(results);

            const spaceId = currentSpace?.id;
            if (spaceId) {
              charmClient.track.trackAction('import_page_csv', { pageId, spaceId });
            }
            showMessage('Your csv file was imported successfully', 'success');
          }
        }
      });
    }
  };

  return (
    <List dense>
      <ListItemButton
        onClick={() => {
          toggleFavorite();
          closeMenu();
        }}
      >
        <Box
          sx={{
            mr: 0.5,
            position: 'relative',
            left: -4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isFavorite ? <FavoritedIcon /> : <NotFavoritedIcon />}
        </Box>
        <ListItemText primary={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} />
      </ListItemButton>
      <ListItemButton onClick={onCopyLink}>
        <ContentCopyIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Copy link' />
      </ListItemButton>
      <Divider />
      <Tooltip title={!pagePermissions?.delete ? "You don't have permission to delete this page" : ''}>
        <div>
          <ListItemButton disabled={!pagePermissions?.delete} onClick={onDeletePage}>
            <DeleteOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Delete' />
          </ListItemButton>
        </div>
      </Tooltip>
      <ListItemButton onClick={exportCsv}>
        <FormatListBulletedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Export to CSV' />
      </ListItemButton>
      <ListItemButton component='label'>
        <input hidden type='file' name='csvfile' accept='.csv' onChange={importCsv} />
        <VerticalAlignBottomOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Import CSV' />
      </ListItemButton>
    </List>
  );
}
