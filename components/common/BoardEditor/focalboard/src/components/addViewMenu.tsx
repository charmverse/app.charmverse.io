/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
import styled from '@emotion/styled';
import { Add } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { SxProps } from '@mui/system';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useCallback } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import Button from 'components/common/Button';

import type { Block } from '../blocks/block';
import type { Board, IPropertyTemplate } from '../blocks/board';
import type { BoardView } from '../blocks/boardView';
import { createBoardView } from '../blocks/boardView';
import { Constants } from '../constants';
import mutator from '../mutator';
import { Utils } from '../utils';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';

type AddViewProps = {
  board: Board;
  activeView?: BoardView;
  views: BoardView[];
  intl: IntlShape;
  showLabel?: boolean;
  showView: (viewId: string) => void;
  sx?: SxProps;
  onClick?: () => void;
}

function AddViewMenu (props: AddViewProps) {

  const intl = props.intl;
  const showView = props.showView;

  const popupState = usePopupState({ variant: 'popover', popupId: 'add-view-menu' });

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
    const { board, activeView, intl } = props;
    Utils.log('addview-board');
    // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardView, {board: board.id, view: activeView.id})
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewBoardTitle', defaultMessage: 'Board view' });
    view.fields.viewType = 'board';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    const oldViewId = activeView?.id;

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        // setTimeout(() => {
        //     Utils.log(`showView: ${block.id}`)
        //     showView(block.id)
        // }, 120)
        showView(block.id);
      },
      async () => {
        oldViewId && showView(oldViewId);
      }
    );
    popupState.close();
  }, [props.activeView, props.board, props.intl, showView]);

  const handleAddViewTable = useCallback(() => {
    const { board, activeView, intl } = props;

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

    const oldViewId = activeView?.id;

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        // setTimeout(() => {
        //     Utils.log(`showView: ${block.id}`)
        //     showView(block.id)
        // }, 120)
        showView(block.id);
      },
      async () => {
        oldViewId && showView(oldViewId);
      }
    );
    popupState.close();
  }, [props.activeView, props.board, props.intl, showView]);

  const handleAddViewGallery = useCallback(() => {
    const { board, activeView, intl } = props;

    Utils.log('addview-gallery');
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewGalleryTitle', defaultMessage: 'Gallery view' });
    view.fields.viewType = 'gallery';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = [Constants.titleColumnId];
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    const oldViewId = activeView?.id;

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        setTimeout(() => {
          Utils.log(`showView: ${block.id}`);
          showView(block.id);
        }, 120);
      },
      async () => {
        oldViewId && showView(oldViewId);
      }
    );
    popupState.close();
  }, [props.board, props.activeView, props.intl, showView]);

  const handleAddViewCalendar = useCallback(() => {
    const { board, activeView, intl } = props;

    Utils.log('addview-calendar');
    const view = createBoardView();
    view.title = intl.formatMessage({ id: 'View.NewCalendarTitle', defaultMessage: 'Calendar View' });
    view.fields.viewType = 'calendar';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = [Constants.titleColumnId];
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    const oldViewId = activeView?.id;

    // Find first date property
    view.fields.dateDisplayPropertyId = board.fields.cardProperties.find((o: IPropertyTemplate) => o.type === 'date')?.id;

    mutator.insertBlock(
      view,
      'add view',
      async (block: Block) => {
        // This delay is needed because WSClient has a default 100 ms notification delay before updates
        setTimeout(() => {
          Utils.log(`showView: ${block.id}`);
          showView(block.id);
        }, 120);
      },
      async () => {
        oldViewId && showView(oldViewId);
      }
    );
    popupState.close();
  }, [props.board, props.activeView, props.intl, showView]);

  const triggers = props.onClick ? { onClick: props.onClick } : bindTrigger(popupState);

  return (
    <>
      {props.showLabel ? (
        <Button
          {...triggers}
          color='secondary'
          size='small'
          startIcon={<Add />}
          variant='text'
        >
          Add view
        </Button>
      ) : (
        <IconButton {...triggers} color='secondary' size='small'>
          <Add fontSize='small' />
        </IconButton>
      )}
      <Menu {...bindMenu(popupState)}>
        <MenuItem dense onClick={handleAddViewBoard}>
          <ListItemIcon><BoardIcon /></ListItemIcon>
          <ListItemText>{boardText}</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={handleAddViewTable}>
          <ListItemIcon><TableIcon /></ListItemIcon>
          <ListItemText>{tableText}</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={handleAddViewGallery}>
          <ListItemIcon><GalleryIcon /></ListItemIcon>
          <ListItemText>{galleryText}</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={handleAddViewCalendar}>
          <ListItemIcon><CalendarIcon /></ListItemIcon>
          <ListItemText>Calendar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default injectIntl(AddViewMenu);
