import { Box, Card, Grid, Typography } from '@mui/material';
import { useCallback } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';

import type { Board, IPropertyTemplate } from '../../blocks/board';
import type { BoardView } from '../../blocks/boardView';
import { createBoardView } from '../../blocks/boardView';
import { Constants } from '../../constants';
import mutator from '../../mutator';
import { useAppDispatch } from '../../store/hooks';
import { updateView } from '../../store/views';
import BoardIcon from '../../widgets/icons/board';
import CalendarIcon from '../../widgets/icons/calendar';
import GalleryIcon from '../../widgets/icons/gallery';
import TableIcon from '../../widgets/icons/table';

interface LayoutOptionsProps {
  board: Board;
  view: BoardView;
  intl: IntlShape;
}

function LayoutOptions (props: LayoutOptionsProps) {

  const dispatch = useAppDispatch();

  const intl = props.intl;
  const activeView = props.view;

  const boardText = intl.formatMessage({
    id: 'View.Board',
    defaultMessage: 'Board'
  });
  const tableText = intl.formatMessage({
    id: 'View.Table',
    defaultMessage: 'Table'
  });
  const galleryText = intl.formatMessage({
    id: 'View.Gallery',
    defaultMessage: 'Gallery'
  });

  const handleAddViewBoard = useCallback(async () => {
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'board';
    newView.fields.cardOrder = newView.fields.cardOrder ?? [];
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    }
    catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  const handleAddViewTable = useCallback(async () => {
    const { board } = props;
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'table';
    newView.fields.visiblePropertyIds = board.fields.cardProperties.map((o: IPropertyTemplate) => o.id);
    newView.fields.columnWidths = {};
    newView.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth;
    newView.fields.cardOrder = newView.fields.cardOrder ?? [];
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    }
    catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  const handleAddViewGallery = useCallback(async () => {
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'gallery';
    newView.fields.visiblePropertyIds = [Constants.titleColumnId];
    newView.fields.cardOrder = newView?.fields.cardOrder ?? [];
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    }
    catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  const handleAddViewCalendar = useCallback(async () => {
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'calendar';
    newView.fields.visiblePropertyIds = [Constants.titleColumnId];
    newView.fields.cardOrder = activeView?.fields.cardOrder ?? [];
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    }
    catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  return (
    <Box onClick={e => e.stopPropagation()}>
      <Grid container spacing={1} px={1}>
        <LayoutOption active={activeView.fields.viewType === 'board'} onClick={handleAddViewBoard}>
          <BoardIcon />
          {boardText}
        </LayoutOption>
        <LayoutOption active={activeView.fields.viewType === 'table'} onClick={handleAddViewTable}>
          <TableIcon />
          {tableText}
        </LayoutOption>
        <LayoutOption active={activeView.fields.viewType === 'gallery'} onClick={handleAddViewGallery}>
          <GalleryIcon />
          {galleryText}
        </LayoutOption>
        <LayoutOption active={activeView.fields.viewType === 'calendar'} onClick={handleAddViewCalendar}>
          <CalendarIcon />
          Calendar
        </LayoutOption>
      </Grid>
    </Box>
  );
}

function LayoutOption ({ active, onClick, children }: { active?: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <Grid item xs={6} onClick={onClick}>
      <Card variant='outlined' sx={{ height: '100%', cursor: 'pointer', borderColor: active ? 'var(--primary-color)' : '', '&:hover': { bgcolor: !active ? 'sidebar.background' : '' } }}>
        <Typography variant='body2' color={active ? 'primary' : 'secondary'}>
          <Box component='span' display='flex' p={1} alignItems='center' flexDirection='column' justifyContent='center'>
            {children}
          </Box>
        </Typography>
      </Card>
    </Grid>
  );

}

export default injectIntl(LayoutOptions);
