// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect, useCallback, MouseEvent, ReactNode} from 'react'
import { injectIntl, IntlShape } from 'react-intl';
import {FormattedMessage} from 'react-intl'
import { useRouter } from 'next/router'
import NextLink from 'next/link';
import InputAdornment from '@mui/material/InputAdornment';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import { IDType, Utils } from '../../utils';
import { BoardView, createBoardView, IViewType } from '../../blocks/boardView';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { generatePath } from 'lib/utilities/strings';
import ViewMenu, { iconForViewType } from '../viewMenu'
import AddViewMenu from '../addViewMenu'
import mutator from '../../mutator'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import Button from 'components/common/Button'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import DeleteIcon from '../../widgets/icons/delete';
import DuplicateIcon from '../../widgets/icons/duplicate';
import EditIcon from '@mui/icons-material/Edit';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import IconButton from '../../widgets/buttons/iconButton'
import DropdownIcon from '../../widgets/icons/dropdown'
import MenuWrapper from '../../widgets/menuWrapper'
import Editable from '../../widgets/editable'

import ModalWrapper from '../modalWrapper'

import NewCardButton from './newCardButton'
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu'
import ViewHeaderSortMenu from './viewHeaderSortMenu'
import ViewHeaderActionsMenu from './viewHeaderActionsMenu'
import ViewHeaderSearch from './viewHeaderSearch'
import FilterComponent from './filterComponent'
import { useForm } from 'react-hook-form';

interface ViewTabsProps {
  intl: IntlShape;
  readonly?: boolean;
  views : BoardView[];
  showView: (viewId: string) => void;
}

function ViewTabs ({ intl, readonly, showView, views }: ViewTabsProps) {

  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentView, setCurrentView] = useState<BoardView | null>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'rename-view-popup' });

  const {
    register,
    handleSubmit
  } = useForm<{ title: string }>();

  function handleViewClick (event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (readonly) return;
    // event.detail tells us how many times the mouse was clicked
    if (event.detail > 1) {
      setAnchorEl(event.currentTarget);
      const view = views.find(v => v.id === event.currentTarget.id)
      if (view) {
        setCurrentView(view)
      }
      event.preventDefault();
    }
  }

  function handleClose () {
    setAnchorEl(null);
    setCurrentView(null);
  }

  function getViewUrl (viewId: string) {
    let boardUrl = generatePath(router.pathname, router.query)
    return `${boardUrl}?viewId=${viewId}`
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
      }
  }, [views, currentView, showView])

  function handleRenameView () {
    handleClose();
    popupState.open();
  }

  function saveViewTitle (form: { title: string }) {
    if (currentView) {
      mutator.changeTitle(currentView.id, currentView.title, form.title)
      popupState.close()
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
    <Tabs textColor='primary' indicatorColor='secondary' value={router.query.viewId} sx={{ minHeight: 40 }}>
      {views.map(view => (
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
                color={router.query.viewId === view.id ? 'textPrimary' : 'secondary'}
                id={view.id}
                href={getViewUrl(view.id)}
                sx={{ px: 1.5 }}
            >
                {view.title}
            </Button>
          }
          sx={{ p: 0 }}
          value={view.id}
        />
      ))}
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
        <ListItemIcon><DuplicateIcon/></ListItemIcon>
        <ListItemText>{duplicateViewText}</ListItemText>
      </MenuItem>
      <MenuItem dense onClick={handleDeleteView}>
        <ListItemIcon><DeleteIcon/></ListItemIcon>
        <ListItemText>{deleteViewText}</ListItemText>
      </MenuItem>
    </Menu>

    {/* Form to rename views */}
    <Modal open={popupState.isOpen} onClose={popupState.close} title='Rename the view'>
      <form onSubmit={handleSubmit(saveViewTitle)}>
        <TextField {...register('title')} defaultValue={currentView?.title} />
        <Button type='submit'>Save</Button>
      </form>
    </Modal>
  </>);
}

export default injectIntl(ViewTabs);