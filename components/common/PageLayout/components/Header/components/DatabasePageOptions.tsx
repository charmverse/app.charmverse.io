import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import { Divider, Tooltip } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import type { Board } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import type { BoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import type { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
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
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useToggleFavorite } from 'hooks/useToggleFavorite';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

interface Props {
  closeMenu: () => void;
  pageId?: string;
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

  const activeBoardId = view?.fields.linkedSourceId || view?.rootId;
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
  const cardPages: CardPage[] = cards.map((card) => ({ card, page: pages[card.id]! })).filter(({ page }) => !!page);

  const sortedCardPages = sortCards(cardPages, board, view, members);

  async function onDeletePage() {
    if (pageId) {
      await deletePage({
        pageId
      });
      closeMenu();
    }
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
  };

  function onCopyLink() {
    Utils.copyTextToClipboard(window.location.href);
    showMessage('Copied link to clipboard', 'success');
    closeMenu();
  }

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
    </List>
  );
}
