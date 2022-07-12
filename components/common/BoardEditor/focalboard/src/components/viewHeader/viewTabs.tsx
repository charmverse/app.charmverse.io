// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { useState, useCallback, MouseEvent } from 'react'
import { injectIntl, IntlShape } from 'react-intl';
import { useRouter } from 'next/router'
import Modal from 'components/common/Modal';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import { IDType, Utils } from '../../utils';
import { BoardView, createBoardView } from '../../blocks/boardView';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { iconForViewType } from '../viewMenu'
import mutator from '../../mutator'
import Button from 'components/common/Button'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import DeleteIcon from '../../widgets/icons/delete';
import DuplicateIcon from '../../widgets/icons/duplicate';
import EditIcon from '@mui/icons-material/Edit';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import { useForm } from 'react-hook-form';
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import AddViewMenu from '../addViewMenu';
import { Board } from 'lib/focalboard/board';
import { Box } from '@mui/system';
import { Typography } from '@mui/material';
import Link from 'next/link';
interface ViewTabsProps {
  intl: IntlShape;
  board: Board
  activeView: BoardView
  readonly?: boolean;
  views: BoardView[];
  showView: (viewId: string) => void;
}

const SHOWN_VIEWS = 3;

function ViewTabs({ board, activeView, intl, readonly, showView, views }: ViewTabsProps) {
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentView, setCurrentView] = useState<BoardView | null>(null);
  const renameViewPopupState = usePopupState({ variant: 'popover', popupId: 'rename-view-popup' });
  const showViewsPopupState = usePopupState({variant: "popover", popupId: "show-views-popup"});
  const showViewsTriggerState = bindTrigger(showViewsPopupState);
  const showViewsMenuState = bindMenu(showViewsPopupState);

  const { setFocalboardViewsRecord } = useFocalboardViews();

  // Find the index of the current view
  const currentViewId = router.query.viewId || activeView.id;
  const currentViewIndex = views.findIndex(view => view.id === currentViewId)
  const shownViews = views.slice(0, SHOWN_VIEWS)
  let restViews = views.slice(SHOWN_VIEWS);

  // If the current view index is more than what we can show in the screen
  if (currentViewIndex >= SHOWN_VIEWS) {
    const replacedView = shownViews[SHOWN_VIEWS - 1]
    // Replace the current view as the last view of the shown views
    shownViews[SHOWN_VIEWS - 1] = views[currentViewIndex];
    restViews = restViews.filter(restView => restView.id !== currentViewId);
    restViews.unshift(replacedView)
  }

  const {
    register,
    handleSubmit
  } = useForm<{ title: string }>();

  function handleViewClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    if (readonly) return;
    const view = views.find(v => v.id === event.currentTarget.id)
    // event.detail tells us how many times the mouse was clicked
    if (event.currentTarget.id === currentViewId) {
      event.preventDefault();
      setAnchorEl(event.currentTarget);
      if (view) {
        setCurrentView(view)
      }
    }
    if (view) {
      setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [board.id]: view.id }))
    }
  }

  function handleClose() {
    setAnchorEl(null);
    setCurrentView(null);
  }

  function getViewUrl(viewId: string) {
    return {
      pathname: router.pathname,
      query: {
        ...router.query,
        viewId
      }
    };
  }

  const handleDuplicateView = useCallback(() => {
    if (!currentView) return;

    const newView = createBoardView(currentView)
    newView.title = `${currentView.title} copy`
    newView.id = Utils.createGuid(IDType.View)
    mutator.insertBlock(
      newView,
      'duplicate view',
      async (block) => {
        showView(block.id)
        setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [board.id]: newView.id }))
      },
      async () => {
        showView(currentView.id)
      },
    )
  }, [currentView, showView])

  const handleDeleteView = useCallback(() => {
    Utils.log('deleteView')
    if (!currentView) return;

    const nextView = views.find((o) => o !== currentView)
    mutator.deleteBlock(currentView, 'delete view')
    if (nextView) {
      showView(nextView.id)
      setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [board.id]: nextView.id }))
    }
  }, [views, currentView, showView])

  function handleRenameView() {
    setAnchorEl(null);
    renameViewPopupState.open();
  }

  function saveViewTitle(form: { title: string }) {
    if (currentView) {
      mutator.changeTitle(currentView.id, currentView.title, form.title)
      renameViewPopupState.close()
    }
  }

  const duplicateViewText = intl.formatMessage({
    id: 'View.DuplicateView',
    defaultMessage: 'Duplicate view',
  })
  const deleteViewText = intl.formatMessage({
    id: 'View.DeleteView',
    defaultMessage: 'Delete view',
  })

  return (<>
    <Tabs textColor='primary' indicatorColor='secondary' value={currentViewId} sx={{ minHeight: 40 }}>
      {shownViews.map(view => (
        <Tab
          component='div'
          disableRipple
          key={view.id}
          label={
            <Button
              startIcon={iconForViewType(view.fields.viewType)}
              onClick={handleViewClick}
              variant='text'
              size='small'
              color={currentViewId === view.id ? 'textPrimary' : 'secondary'}
              id={view.id}
              href={currentViewId === view.id ? null : getViewUrl(view.id)}
              sx={{ px: 1.5 }}
            >
              {view.title}
            </Button>
          }
          sx={{ p: 0 }}
          value={view.id}
        />
      ))}
      {restViews.length !== 0 && <Tab component="div" disableRipple label={
        <Button
          variant='text'
          size='small'
          color="secondary"
          {...showViewsTriggerState}
        >
          {restViews.length} more...
        </Button>
      } />}
    </Tabs>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      <MenuItem dense onClick={handleRenameView}>
        <ListItemIcon><EditIcon fontSize='small' /></ListItemIcon>
        <ListItemText>Rename</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem dense onClick={handleDuplicateView}>
        <ListItemIcon><DuplicateIcon /></ListItemIcon>
        <ListItemText>{duplicateViewText}</ListItemText>
      </MenuItem>
      {views.length !== 1 && <MenuItem dense onClick={handleDeleteView}>
        <ListItemIcon><DeleteIcon /></ListItemIcon>
        <ListItemText>{deleteViewText}</ListItemText>
      </MenuItem>}
    </Menu>

    <Menu
      {...showViewsMenuState}
    >
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        mb: 1
      }}>
        {restViews.map(view => (
          <MenuItem key={view.id} dense>
            <Link
              color={'textPrimary'}
              href={getViewUrl(view.id)}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                {iconForViewType(view.fields.viewType)}
                <Typography>
                  {view.title}
                </Typography>
              </Box>
            </Link>
          </MenuItem>
        ))}
      </Box>
      <Divider />
      <AddViewMenu sx={{
        width: "100%"
      }} board={board} activeView={activeView} showView={showView} views={views}/>
    </Menu>

    {/* Form to rename views */}
    <Modal open={renameViewPopupState.isOpen} onClose={renameViewPopupState.close} title='Rename the view'>
      <form onSubmit={handleSubmit(saveViewTitle)}>
        <TextField {...register('title')} defaultValue={currentView?.title} autoFocus />
        <Button type='submit'>Save</Button>
      </form>
    </Modal>
  </>);
}

export default injectIntl(ViewTabs);