/* eslint-disable no-unused-expressions */

import { Add } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import { Button } from 'components/common/Button';
import type { UIBlockWithDetails } from '@packages/databases/block';
import type { Board, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView, IViewType } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import { Constants } from '@packages/databases/constants';
import { createTableView } from '@packages/databases/tableView';

import mutator from '../mutator';
import { publishIncrementalUpdate } from '../publisher';
import { Utils } from '../utils';
import IconButton from '../widgets/buttons/iconButton';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';
import { typeDisplayName } from '../widgets/typeDisplayName';

/**
 * @onClick // Default behaviour is to show a dropdown with views. If this provided, then onClick will be handled externally
 */
type AddViewProps = {
  board: Board;
  activeView?: BoardView;
  views: BoardView[];
  intl: IntlShape;
  showLabel?: boolean;
  showView: (viewId: string) => void;
  sx?: SxProps<Theme>;
  onClick?: () => void; // override the icon click
  onClose?: () => void;
  supportedViewTypes?: IViewType[];
};

function AddViewMenu(props: AddViewProps) {
  const intl = props.intl;
  const showView = props.showView;
  const { supportedViewTypes } = props;

  const views = props.views.filter((view) => !view.fields.inline);

  const viewIdsFromFields = props.board.fields?.viewIds ?? [];
  const viewIds = viewIdsFromFields.length === views.length ? viewIdsFromFields : views.map((view) => view.id);

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

  const handleAddViewBoard = useCallback(async () => {
    const { board, activeView } = props;
    Utils.log('addview-board');
    const view = createBoardView();
    view.title = '';
    view.fields.viewType = 'board';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    const oldViewId = activeView?.id;

    await mutator.insertBlock(
      view,
      'add view',
      async (block: UIBlockWithDetails) => {
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

    await mutator.patchBlock(board.id, { updatedFields: { viewIds: [...viewIds, view.id] } }, publishIncrementalUpdate);
    closePopup();
  }, [viewIds, props.activeView, props.board, props.intl, showView]);

  const handleAddViewTable = useCallback(async () => {
    const { board, activeView } = props;

    Utils.log('addview-table');
    const view = createTableView({ board, activeView });
    view.id = uuid();

    const oldViewId = activeView?.id;

    await mutator.insertBlock(
      view,
      'add view',
      async (block: UIBlockWithDetails) => {
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

    await mutator.patchBlock(board.id, { updatedFields: { viewIds: [...viewIds, view.id] } }, publishIncrementalUpdate);

    closePopup();
  }, [viewIds, props.activeView, props.board, props.intl, showView]);

  const handleAddViewGallery = useCallback(async () => {
    const { board, activeView } = props;

    Utils.log('addview-gallery');
    const view = createBoardView();
    view.title = '';
    view.fields.viewType = 'gallery';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = [Constants.titleColumnId];
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    const oldViewId = activeView?.id;

    await mutator.insertBlock(
      view,
      'add view',
      async (block: UIBlockWithDetails) => {
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
    await mutator.patchBlock(board.id, { updatedFields: { viewIds: [...viewIds, view.id] } }, publishIncrementalUpdate);
    closePopup();
  }, [viewIds, props.board, props.activeView, props.intl, showView]);

  const handleAddViewCalendar = useCallback(async () => {
    const { board, activeView } = props;

    Utils.log('addview-calendar');
    const view = createBoardView();
    view.title = '';
    view.fields.viewType = 'calendar';
    view.parentId = board.id;
    view.rootId = board.rootId;
    view.fields.visiblePropertyIds = [Constants.titleColumnId];
    view.fields.cardOrder = activeView?.fields.cardOrder ?? [];

    const oldViewId = activeView?.id;

    // Find first date property
    view.fields.dateDisplayPropertyId = board.fields.cardProperties.find(
      (o: IPropertyTemplate) => o.type === 'date'
    )?.id;

    // Create one if it doesn't exist
    if (!view.fields.dateDisplayPropertyId) {
      const template: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: typeDisplayName(intl, 'date'),
        type: 'date',
        options: []
      };
      mutator.insertPropertyTemplate(board, view, -1, template);
      view.fields.dateDisplayPropertyId = template.id;
    }

    await mutator.insertBlock(
      view,
      'add view',
      async (block: UIBlockWithDetails) => {
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

    await mutator.patchBlock(board.id, { updatedFields: { viewIds: [...viewIds, view.id] } }, publishIncrementalUpdate);

    closePopup();
  }, [viewIds, props.board, props.activeView, props.intl, showView]);

  function onClickIcon(e: MouseEvent) {
    if (props.onClick) {
      props.onClick();
      closePopup();
    } else {
      popupState.open(e);
    }
  }

  function closePopup() {
    popupState.close();
    props.onClose?.();
  }

  return (
    <>
      {props.showLabel ? (
        <Button onClick={onClickIcon} color='secondary' size='small' startIcon={<Add />} variant='text'>
          Add view
        </Button>
      ) : (
        <IconButton
          style={{ width: 28, height: 28 }}
          onClick={onClickIcon}
          icon={<Add color='secondary' fontSize='small' />}
        />
      )}
      <Menu {...bindMenu(popupState)}>
        {isSupportedViewType('board', supportedViewTypes) && (
          <MenuItem dense onClick={handleAddViewBoard}>
            <ListItemIcon>
              <BoardIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>{boardText}</ListItemText>
          </MenuItem>
        )}
        {isSupportedViewType('table', supportedViewTypes) && (
          <MenuItem dense onClick={handleAddViewTable}>
            <ListItemIcon>
              <TableIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>{tableText}</ListItemText>
          </MenuItem>
        )}
        {isSupportedViewType('gallery', supportedViewTypes) && (
          <MenuItem dense onClick={handleAddViewGallery}>
            <ListItemIcon>
              <GalleryIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>{galleryText}</ListItemText>
          </MenuItem>
        )}
        {isSupportedViewType('calendar', supportedViewTypes) && (
          <MenuItem dense onClick={handleAddViewCalendar}>
            <ListItemIcon>
              <CalendarIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Calendar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
export default injectIntl(AddViewMenu);

export function isSupportedViewType(viewType: IViewType, supportedViewTypes?: IViewType[]) {
  if (!supportedViewTypes) {
    return true;
  }

  return supportedViewTypes.includes(viewType);
}
