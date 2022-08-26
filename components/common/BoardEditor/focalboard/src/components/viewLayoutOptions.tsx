import { useCallback } from 'react';
import { IntlShape, injectIntl } from 'react-intl';
import { Box, Card, Grid, Typography } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import { Block } from '../blocks/block';
import { Board, IPropertyTemplate } from '../blocks/board';
import { BoardView, createBoardView } from '../blocks/boardView';
import { Constants } from '../constants';
import mutator from '../mutator';
import { Utils } from '../utils';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';

interface LayoutOptionsProps {
  board: Board;
  view: BoardView;
  intl: IntlShape;
}

function LayoutOptions (props: LayoutOptionsProps) {

  const intl = props.intl;

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

  const handleAddViewBoard = useCallback(() => {
    const { board, view: activeView, intl } = props;
    Utils.log('addview-board');
    // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardView, {board: board.id, view: activeView.id})
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewBoardTitle', defaultMessage: 'Board view' });
    view.fields.viewType = 'board';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        // setTimeout(() => {
        //     Utils.log(`showView: ${block.id}`)
        //     showView(block.id)
        // }, 120)
      },
      async () => {
      }
    );
  }, [props.view, props.board, props.intl]);

  const handleAddViewTable = useCallback(() => {
    const { board, view: activeView, intl } = props;

    Utils.log('addview-table');
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewTableTitle', defaultMessage: 'Table view' });
    view.fields.viewType = 'table';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = board.fields.cardProperties.map((o: IPropertyTemplate) => o.id);
    view.fields.columnWidths = {};
    view.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth;
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        // setTimeout(() => {
        //     Utils.log(`showView: ${block.id}`)
        //     showView(block.id)
        // }, 120)
      },
      async () => {
      }
    );
  }, [props.view, props.board, props.intl]);

  const handleAddViewGallery = useCallback(() => {
    const { board, view: activeView, intl } = props;

    Utils.log('addview-gallery');
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewGalleryTitle', defaultMessage: 'Gallery view' });
    view.fields.viewType = 'gallery';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = [Constants.titleColumnId];
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        setTimeout(() => {
          Utils.log(`showView: ${block.id}`);
        }, 120);
      },
      async () => {
      }
    );
  }, [props.board, props.view, props.intl]);

  const handleAddViewCalendar = useCallback(() => {
    const { board, view: activeView, intl } = props;

    Utils.log('addview-calendar');
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewCalendarTitle', defaultMessage: 'Calendar View' });
    view.fields.viewType = 'calendar';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = [Constants.titleColumnId];
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    // Find first date property
    view.fields.dateDisplayPropertyId = board.fields.cardProperties.find((o: IPropertyTemplate) => o.type === 'date')?.id;

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
      },
      async () => {
      }
    );
  }, [props.board, props.view, props.intl]);

  return (
    <>
      <Grid container spacing={1} px={1}>
        <LayoutOption active={true} onClick={handleAddViewBoard}>
          <BoardIcon />
          {boardText}
        </LayoutOption>
        <LayoutOption onClick={handleAddViewTable}>
          <TableIcon />
          {tableText}
        </LayoutOption>
        <LayoutOption onClick={handleAddViewGallery}>
          <GalleryIcon />
          {galleryText}
        </LayoutOption>
        <LayoutOption onClick={handleAddViewCalendar}>
          <CalendarIcon />
          Calendar
        </LayoutOption>
      </Grid>
    </>
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
  )

}

export default injectIntl(LayoutOptions);
