import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import type { Board, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView, IViewType } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import { useAppDispatch } from '@packages/databases/store/hooks';
import { updateView } from '@packages/databases/store/views';
import { Utils } from '@packages/databases/utils';
import { useCallback } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import SelectMenu from 'components/common/Menu';
import { useIsAdmin } from 'hooks/useIsAdmin';

import BoardIcon from '../../widgets/icons/board';
import CalendarIcon from '../../widgets/icons/calendar';
import GalleryIcon from '../../widgets/icons/gallery';
import TableIcon from '../../widgets/icons/table';
import { typeDisplayName } from '../../widgets/typeDisplayName';
import { isSupportedViewType } from '../addViewMenu';

interface LayoutOptionsProps {
  board?: Board;
  view: BoardView;
  intl: IntlShape;
  hideLayoutSelectOptions?: boolean;
  supportedViewTypes?: IViewType[];
}

function LayoutOptions(props: LayoutOptionsProps) {
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
  const intl = props.intl;
  const hideLayoutSelectOptions = props.hideLayoutSelectOptions ?? false;
  const activeView = props.view;
  const { supportedViewTypes } = props;

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

  const handleViewOpenPage = useCallback(
    async (openPageIn: 'full_page' | 'center_peek') => {
      const newView = createBoardView(activeView);
      newView.fields.openPageIn = openPageIn;
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view open page');
    },
    [activeView]
  );

  const handleAddViewBoard = useCallback(async () => {
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'board';
    newView.fields.cardOrder = newView.fields.cardOrder ?? [];
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    } catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  const handleAddViewTable = useCallback(async () => {
    const { board } = props;
    const properties = board?.fields.cardProperties ?? [];
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'table';
    newView.fields.visiblePropertyIds = properties.map((o: IPropertyTemplate) => o.id) ?? [];
    newView.fields.columnWidths = {};
    newView.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth;
    newView.fields.cardOrder = newView.fields.cardOrder ?? [];
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    } catch {
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
    } catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  const handleAddViewCalendar = useCallback(async () => {
    const { board } = props;
    const newView = createBoardView(activeView);
    newView.fields.viewType = 'calendar';
    newView.fields.visiblePropertyIds = [Constants.titleColumnId];
    newView.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    // Find first date property
    newView.fields.dateDisplayPropertyId = board!.fields.cardProperties.find(
      (o: IPropertyTemplate) => o.type === 'date'
    )?.id;

    // Create one if it doesn't exist
    if (!newView.fields.dateDisplayPropertyId) {
      const template: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: typeDisplayName(intl, 'date'),
        type: 'date',
        options: []
      };
      mutator.insertPropertyTemplate(board!, newView, -1, template);
      newView.fields.dateDisplayPropertyId = template.id;
    }

    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view type');
    } catch {
      dispatch(updateView(activeView));
    }
  }, [activeView]);

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      {!hideLayoutSelectOptions && (
        <Grid container spacing={1} px={1}>
          {isSupportedViewType('board', supportedViewTypes) && (
            <LayoutOption active={activeView.fields.viewType === 'board'} onClick={handleAddViewBoard}>
              <BoardIcon />
              {boardText}
            </LayoutOption>
          )}
          {isSupportedViewType('table', supportedViewTypes) && (
            <LayoutOption active={activeView.fields.viewType === 'table'} onClick={handleAddViewTable}>
              <TableIcon />
              {tableText}
            </LayoutOption>
          )}
          {isSupportedViewType('gallery', supportedViewTypes) && (
            <LayoutOption active={activeView.fields.viewType === 'gallery'} onClick={handleAddViewGallery}>
              <GalleryIcon />
              {galleryText}
            </LayoutOption>
          )}
          {isSupportedViewType('calendar', supportedViewTypes) && (
            <LayoutOption active={activeView.fields.viewType === 'calendar'} onClick={handleAddViewCalendar}>
              <CalendarIcon />
              Calendar
            </LayoutOption>
          )}
        </Grid>
      )}
      <Stack pr={1} pl={2} my={1} alignItems='center' flexDirection='row' justifyContent='space-between'>
        <Typography variant='subtitle2' component='div'>
          Open pages in
        </Typography>
        <SelectMenu
          disabled={!isAdmin}
          buttonSize='small'
          selectedValue={activeView.fields.openPageIn ?? 'center_peek'}
          options={[
            {
              primary: 'Center peek',
              secondary: 'Open pages in a focused, centered modal.',
              value: 'center_peek'
            },
            {
              primary: 'Full page',
              secondary: 'Open pages in full page.',
              value: 'full_page'
            }
          ]}
          valueUpdated={(openPageIn) => {
            handleViewOpenPage(openPageIn as 'center_peek' | 'full_page');
          }}
        />
      </Stack>
    </Box>
  );
}

function LayoutOption({
  active,
  onClick,
  children
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Grid size={6} onClick={onClick}>
      <Card
        variant='outlined'
        sx={{
          height: '100%',
          cursor: 'pointer',
          borderColor: active ? 'var(--primary-color)' : '',
          '&:hover': { bgcolor: !active ? 'sidebar.background' : '' }
        }}
      >
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
