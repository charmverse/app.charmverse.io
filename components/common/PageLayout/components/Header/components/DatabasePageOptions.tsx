
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { onExportCsvTrigger } from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderActionsMenu';
import { getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { usePages } from 'hooks/usePages';
import { isTruthy } from 'lib/utilities/types';

interface Props {
  closeMenu: () => void;
}

export default function DatabaseOptions ({ closeMenu }: Props) {
  const intl = useIntl();
  const router = useRouter();
  const { pages } = usePages();
  const view = useAppSelector(getView(router.query.viewId as string));
  const boards = useAppSelector(getSortedBoards);

  const activeBoardId = view?.fields.linkedSourceId || view?.rootId;
  const board = boards.find(b => b.id === activeBoardId);

  if (!board || !view) {
    return null;
  }

  const _cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: board.id,
    viewId: view.id
  }));

  const exportCsv = () => {
    const cards = _cards.map(card => {
      const page = pages[card.id];
      // filter cards by whats accessible
      if (!page) {
        return null;
      }
      return {
        ...card,
        // update the title from correct model
        title: page?.title
      };
    }).filter(isTruthy);

    onExportCsvTrigger(board, view, cards, intl);
    closeMenu();
  };

  return (
    <List dense>
      <ListItemButton
        onClick={exportCsv}
      >
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
