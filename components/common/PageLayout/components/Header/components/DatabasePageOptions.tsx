
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
  // @ts-ignore filter cards by whats accessible
  const cards = _cards.filter(card => !!pages[card.id]);

  return (
    <List dense>
      <ListItemButton
        onClick={() => {
          onExportCsvTrigger(board, view, cards, intl);
          closeMenu();
        }}
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
