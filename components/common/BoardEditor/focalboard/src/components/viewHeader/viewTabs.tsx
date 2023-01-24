import styled from '@emotion/styled';
import {
  Edit as EditIcon,
  Tune as TuneIcon,
  DeleteOutline as DeleteOutlineIcon,
  ContentCopy as DuplicateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { TabProps } from '@mui/material/Tab';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/system';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import type { BoardView } from 'lib/focalboard/boardView';
import { formatViewTitle, createBoardView } from 'lib/focalboard/boardView';

import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import { iconForViewType } from '../viewMenu';

// fix types for MUI Tab to include Button Props
const TabButton = Tab as React.ComponentType<TabProps & ButtonProps>;

const StyledTabContent = styled(Typography)`
  padding: ${({ theme }) => theme.spacing('6px', 1, '10px')};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

interface ViewTabsProps {
  intl: IntlShape;
  activeView?: BoardView | null;
  readOnly?: boolean;
  views: BoardView[];
  showView: (viewId: string) => void;
  addViewButton?: ReactNode;
  onDeleteView?: (viewId: string) => void;
  disableUpdatingUrl?: boolean;
  maxTabsShown: number;
  openViewOptions: () => void;
}

function ViewTabs(props: ViewTabsProps) {
  const {
    onDeleteView,
    openViewOptions,
    maxTabsShown,
    disableUpdatingUrl,
    addViewButton,
    activeView,
    intl,
    readOnly,
    showView,
    views: viewsProp
  } = props;
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dropdownView, setDropdownView] = useState<BoardView | null>(null);
  const renameViewPopupState = usePopupState({ variant: 'popover', popupId: 'rename-view-popup' });
  const showViewsPopupState = usePopupState({ variant: 'popover', popupId: 'show-views-popup' });
  const showViewsTriggerState = bindTrigger(showViewsPopupState);
  const showViewsMenuState = bindMenu(showViewsPopupState);

  const views = viewsProp.filter((view) => !view.fields.inline);
  // Find the index of the current view
  const currentViewIndex = views.findIndex((view) => view.id === activeView?.id);
  const shownViews = views.slice(0, maxTabsShown);
  let restViews = views.slice(maxTabsShown);

  // If the current view index is more than what we can show in the screen
  if (currentViewIndex >= maxTabsShown) {
    const replacedView = shownViews[maxTabsShown - 1];
    // Replace the current view as the last view of the shown views
    shownViews[maxTabsShown - 1] = views[currentViewIndex];
    restViews = restViews.filter((restView) => restView.id !== activeView?.id);
    restViews.unshift(replacedView);
  }
  // make sure active view id is visible or the value for Tabs will be invalid
  // during transition between boards, there is a period where activeView has not caught up with the new views
  const activeShowViewId =
    shownViews.find((view) => view.id === activeView?.id)?.id ??
    // check viewId by the query, there is a period where activeView has not caught up
    shownViews.find((view) => view.id === router.query.viewId)?.id ??
    shownViews[0]?.id ??
    false;

  const { register, handleSubmit, setValue } = useForm<{ title: string }>({
    defaultValues: { title: dropdownView?.title || '' }
  });

  function handleViewClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    event.preventDefault();
    const viewId = event.currentTarget.id;
    const view = views.find((v) => v.id === viewId);
    if (!view) {
      return;
    }
    if (view && !readOnly && event.currentTarget.id === activeView?.id) {
      setAnchorEl(event.currentTarget);
      setDropdownView(view);
    } else {
      showView(viewId);
    }
  }

  function handleClose() {
    setAnchorEl(null);
    setDropdownView(null);
  }

  function getViewUrl(viewId: string) {
    const pathWithoutQuery = router.asPath.split('?')[0];
    return `${pathWithoutQuery}?viewId=${viewId}`;
  }

  const handleDuplicateView = useCallback(() => {
    if (!dropdownView) return;

    const newView = createBoardView(dropdownView);
    newView.title = `${dropdownView.title} copy`;
    newView.id = Utils.createGuid(IDType.View);
    mutator.insertBlock(
      newView,
      'duplicate view',
      async (block) => {
        showView(block.id);
      },
      async () => {
        showView(dropdownView.id);
      }
    );
  }, [dropdownView, showView]);

  const handleDeleteView = useCallback(async () => {
    Utils.log('deleteView');
    if (!dropdownView) return;

    const nextView = views.find((o) => o !== dropdownView);
    await mutator.deleteBlock(dropdownView, 'delete view');
    onDeleteView?.(dropdownView.id);
    setAnchorEl(null);
    if (nextView) {
      showView(nextView.id);
    }
  }, [views, dropdownView, showView]);

  function resyncGoogleFormData() {
    if (dropdownView) {
      const newView = createBoardView(dropdownView);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { boardId, ...sourceDataWithoutBoard } = newView.fields.sourceData!;
      newView.fields.sourceData = sourceDataWithoutBoard;
      mutator.updateBlock(newView, dropdownView, 'reset Google view source');
      setAnchorEl(null);
    }
  }

  function handleRenameView() {
    setAnchorEl(null);
    renameViewPopupState.open();
  }

  function handleViewOptions() {
    openViewOptions();
    setAnchorEl(null);
  }

  function saveViewTitle(form: { title: string }) {
    if (dropdownView) {
      mutator.changeTitle(dropdownView.id, dropdownView.title, form.title);
      renameViewPopupState.close();
    }
  }

  const duplicateViewText = intl.formatMessage({
    id: 'View.DuplicateView',
    defaultMessage: 'Duplicate view'
  });
  const deleteViewText = intl.formatMessage({
    id: 'View.DeleteView',
    defaultMessage: 'Delete view'
  });

  // keep form title updated with dropdownView title
  useEffect(() => {
    setValue('title', dropdownView?.title || '');
  }, [dropdownView]);

  return (
    <>
      <Tabs
        // assign a key so that the tabs are remounted when the page change, otherwise the indicator will animate to the new tab
        key={viewsProp[0]?.id}
        textColor='primary'
        indicatorColor='secondary'
        value={activeShowViewId}
        sx={{ minHeight: 0, mb: '-6px' }}
      >
        {shownViews.map((view) => (
          <TabButton
            disableRipple
            key={view.id}
            href={activeView?.id === view.id ? undefined : getViewUrl(view.id)}
            onClick={handleViewClick}
            variant='text'
            size='small'
            id={view.id}
            sx={{ p: 0 }}
            value={view.id}
            label={
              <StyledTabContent
                color={activeView?.id === view.id ? 'textPrimary' : 'secondary'}
                display='flex'
                alignItems='center'
                fontSize='small'
                fontWeight={500}
                gap={1}
              >
                {view.title || formatViewTitle(view)}
              </StyledTabContent>
            }
          />
        ))}
        {restViews.length !== 0 && (
          <TabButton
            disableRipple
            sx={{ p: 0, mb: 0.5 }}
            color='secondary'
            {...showViewsTriggerState}
            label={<>{restViews.length} more...</>}
          />
        )}
      </Tabs>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem dense onClick={handleRenameView}>
          <ListItemIcon>
            <EditIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={handleViewOptions}>
          <ListItemIcon>
            <TuneIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Edit View</ListItemText>
        </MenuItem>
        {dropdownView?.fields.sourceType === 'google_form' && [
          <Divider key='divider' />,
          <MenuItem key='duplicate-view' dense onClick={resyncGoogleFormData}>
            <ListItemIcon>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText>Resync Google Form</ListItemText>
          </MenuItem>,
          <Divider key='divider-2' />
        ]}
        {dropdownView &&
          dropdownView?.fields.sourceType !== 'google_form' && [
            <Divider key='divider' />,
            <MenuItem key='duplicate-view' dense onClick={handleDuplicateView}>
              <ListItemIcon>
                <DuplicateIcon />
              </ListItemIcon>
              <ListItemText>{duplicateViewText}</ListItemText>
            </MenuItem>
          ]}
        {views.length !== 1 && (
          <MenuItem dense onClick={handleDeleteView}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>{deleteViewText}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Menu {...showViewsMenuState}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 1
          }}
        >
          {restViews.map((view) => (
            <MenuItem
              onClick={() => {
                showView(view.id);
                showViewsMenuState.onClose();
              }}
              href={disableUpdatingUrl ? '' : getViewUrl(view.id)}
              component={Link}
              key={view.id}
              dense
            >
              <ListItemIcon>{iconForViewType(view.fields.viewType)}</ListItemIcon>
              <ListItemText>{view.title || formatViewTitle(view)}</ListItemText>
            </MenuItem>
          ))}
        </Box>
        <Divider />
        {addViewButton}
      </Menu>

      {/* Form to rename views */}
      <Modal open={renameViewPopupState.isOpen} onClose={renameViewPopupState.close} title='Rename the view'>
        <form onSubmit={handleSubmit(saveViewTitle)}>
          <TextField {...register('title')} autoFocus />
          <Button type='submit'>Save</Button>
        </form>
      </Modal>
    </>
  );
}

export default injectIntl(ViewTabs);
