import { useCallback } from 'react';
import { injectIntl, IntlShape } from 'react-intl';
import { Block } from '../blocks/block';
import { Board, IPropertyTemplate } from '../blocks/board';
import { BoardView, createBoardView } from '../blocks/boardView';
import { Constants } from '../constants';
import mutator from '../mutator';
import Button from 'components/common/Button';
import { Utils } from '../utils';
import AddIcon from '../widgets/icons/add';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import styled from '@emotion/styled';

type AddViewProps = {
  board: Board,
  activeView: BoardView,
  views: BoardView[],
  intl: IntlShape,
  showView: (viewId: string) => void,
}

const AddButton = styled(Button)`
  font-size: 13.5px !important;
  position: relative;
  top: -3px;
`;

function AddViewMenu (props: AddViewProps) {

  const intl = props.intl;
  const showView = props.showView;

  const popupState = usePopupState({ variant: 'popover', popupId: 'add-view-menu' });

  const addViewText = intl.formatMessage({
      id: 'View.AddView',
      defaultMessage: 'Add view',
  })
  const boardText = intl.formatMessage({
      id: 'View.Board',
      defaultMessage: 'Board',
  })
  const tableText = intl.formatMessage({
      id: 'View.Table',
      defaultMessage: 'Table',
  })
  const galleryText = intl.formatMessage({
      id: 'View.Gallery',
      defaultMessage: 'Gallery',
  })

  const handleAddViewBoard = useCallback(() => {
      const {board, activeView, intl} = props
      Utils.log('addview-board')
      // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardView, {board: board.id, view: activeView.id})
      const view = createBoardView()
      view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})
      view.fields.viewType = 'board'
      view.parentId = board.id
      view.rootId = board.rootId

      const oldViewId = activeView.id

      mutator.insertBlock(
          view,
          'add view',
          async (block: Block) => {
              // This delay is needed because WSClient has a default 100 ms notification delay before updates
              // setTimeout(() => {
              //     Utils.log(`showView: ${block.id}`)
              //     showView(block.id)
              // }, 120)
              showView(block.id)
          },
          async () => {
              showView(oldViewId)
          })
  }, [props.activeView, props.board, props.intl, showView])

  const handleAddViewTable = useCallback(() => {
      const {board, activeView, intl} = props

      Utils.log('addview-table')
      const view = createBoardView()
      view.title = intl.formatMessage({id: 'View.NewTableTitle', defaultMessage: 'Table view'})
      view.fields.viewType = 'table'
      view.parentId = board.id
      view.rootId = board.rootId
      view.fields.visiblePropertyIds = board.fields.cardProperties.map((o: IPropertyTemplate) => o.id)
      view.fields.columnWidths = {}
      view.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth

      const oldViewId = activeView.id

      mutator.insertBlock(
          view,
          'add view',
          async (block: Block) => {
              // This delay is needed because WSClient has a default 100 ms notification delay before updates
              // setTimeout(() => {
              //     Utils.log(`showView: ${block.id}`)
              //     showView(block.id)
              // }, 120)
              showView(block.id)
          },
          async () => {
              showView(oldViewId)
          })
  }, [props.activeView, props.board, props.intl, showView])

  const handleAddViewGallery = useCallback(() => {
      const {board, activeView, intl} = props

      Utils.log('addview-gallery')
      const view = createBoardView()
      view.title = intl.formatMessage({id: 'View.NewGalleryTitle', defaultMessage: 'Gallery view'})
      view.fields.viewType = 'gallery'
      view.parentId = board.id
      view.rootId = board.rootId
      view.fields.visiblePropertyIds = [Constants.titleColumnId]

      const oldViewId = activeView.id

      mutator.insertBlock(
          view,
          'add view',
          async (block: Block) => {
              // This delay is needed because WSClient has a default 100 ms notification delay before updates
              setTimeout(() => {
                  Utils.log(`showView: ${block.id}`)
                  showView(block.id)
              }, 120)
          },
          async () => {
              showView(oldViewId)
          })
  }, [props.board, props.activeView, props.intl, showView])

  const handleAddViewCalendar = useCallback(() => {
      const {board, activeView, intl} = props

      Utils.log('addview-calendar')
      const view = createBoardView()
      view.title = intl.formatMessage({id: 'View.NewCalendarTitle', defaultMessage: 'Calendar View'})
      view.fields.viewType = 'calendar'
      view.parentId = board.id
      view.rootId = board.rootId
      view.fields.visiblePropertyIds = [Constants.titleColumnId]

      const oldViewId = activeView.id

      // Find first date property
      view.fields.dateDisplayPropertyId = board.fields.cardProperties.find((o: IPropertyTemplate) => o.type === 'date')?.id

      mutator.insertBlock(
          view,
          'add view',
          async (block: Block) => {
              // This delay is needed because WSClient has a default 100 ms notification delay before updates
              setTimeout(() => {
                  Utils.log(`showView: ${block.id}`)
                  showView(block.id)
              }, 120)
          },
          async () => {
              showView(oldViewId)
          })
  }, [props.board, props.activeView, props.intl, showView])

  return (
    <>
      <AddButton
        {...bindTrigger(popupState)}
        startIcon={<AddIcon />}
        color='secondary'
        size='small'
        sx={{ px: 1.5 }}
        variant='text'
      >
        {addViewText}
      </AddButton>
      <Menu {...bindMenu(popupState)}>
        <MenuItem onClick={handleAddViewBoard}>
          <ListItemIcon><BoardIcon/></ListItemIcon>
          <ListItemText>{boardText}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddViewTable}>
          <ListItemIcon><TableIcon/></ListItemIcon>
          <ListItemText>{tableText}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddViewGallery}>
          <ListItemIcon><GalleryIcon/></ListItemIcon>
          <ListItemText>{galleryText}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddViewCalendar}>
          <ListItemIcon><CalendarIcon/></ListItemIcon>
          <ListItemText>{'Calendar'}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default injectIntl(AddViewMenu)