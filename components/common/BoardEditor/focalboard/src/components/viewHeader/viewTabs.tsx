import styled from '@emotion/styled';
import DuplicateIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
import { useFocalboardViews } from 'hooks/useFocalboardViews';

import type { BoardView } from '../../blocks/boardView';
import { createBoardView } from '../../blocks/boardView';
import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import { iconForViewType } from '../viewMenu';

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(0.5, 1)};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

interface ViewTabsProps {
  intl: IntlShape;
  viewsBoardId: string;
  activeView?: BoardView | null;
  readOnly?: boolean;
  views: BoardView[];
  showView: (viewId: string) => void;
  addViewButton?: ReactNode;
  onViewTabClick?: (viewId: string) => void;
  onDeleteView?: (viewId: string) => void;
  disableUpdatingUrl?: boolean;
  maxTabsShown: number;
  openViewOptions: () => void;
}

function ViewTabs (props: ViewTabsProps) {
  const {
    onDeleteView,
    openViewOptions,
    maxTabsShown,
    onViewTabClick,
    disableUpdatingUrl,
    addViewButton,
    viewsBoardId,
    activeView,
    intl,
    readOnly,
    showView,
    views: viewsProp } = props;
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dropdownView, setDropdownView] = useState<BoardView | null>(null);
  const renameViewPopupState = usePopupState({ variant: 'popover', popupId: 'rename-view-popup' });
  const showViewsPopupState = usePopupState({ variant: 'popover', popupId: 'show-views-popup' });
  const showViewsTriggerState = bindTrigger(showViewsPopupState);
  const showViewsMenuState = bindMenu(showViewsPopupState);

  const { setFocalboardViewsRecord } = useFocalboardViews();
  const views = viewsProp.filter(view => !view.fields.inline);
  // Find the index of the current view
  const currentViewIndex = views.findIndex(view => view.id === activeView?.id);
  const shownViews = views.slice(0, maxTabsShown);
  let restViews = views.slice(maxTabsShown);

  // If the current view index is more than what we can show in the screen
  if (currentViewIndex >= maxTabsShown) {
    const replacedView = shownViews[maxTabsShown - 1];
    // Replace the current view as the last view of the shown views
    shownViews[maxTabsShown - 1] = views[currentViewIndex];
    restViews = restViews.filter(restView => restView.id !== activeView?.id);
    restViews.unshift(replacedView);
  }

  const {
    register,
    handleSubmit,
    setValue
  } = useForm<{ title: string }>({
    defaultValues: { title: dropdownView?.title || '' }
  });

  function handleViewClick (event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    const view = views.find(v => v.id === event.currentTarget.id);
    // eslint-disable-next-line no-unused-expressions
    view && onViewTabClick?.(view.id);
    if (readOnly) return;
    if (event.currentTarget.id === activeView?.id) {
      event.preventDefault();
      setAnchorEl(event.currentTarget);
      if (view) {
        setDropdownView(view);
      }
    }
    if (view) {
      setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [viewsBoardId]: view.id }));
    }
  }

  function handleClose () {
    setAnchorEl(null);
    setDropdownView(null);
  }

  function getViewUrl (viewId: string) {
    return {
      pathname: router.pathname,
      query: {
        ...router.query,
        viewId
      }
    };
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
        setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [viewsBoardId]: newView.id }));
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
      setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [viewsBoardId]: nextView.id }));
    }
  }, [views, dropdownView, showView]);

  function handleRenameView () {
    setAnchorEl(null);
    renameViewPopupState.open();
  }

  function handleViewOptions () {
    openViewOptions();
    setAnchorEl(null);
  }

  function saveViewTitle (form: { title: string }) {
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
      <Tabs textColor='primary' indicatorColor='secondary' value={activeView?.id ?? false} sx={{ minHeight: 0, mb: '-4px' }}>
        {shownViews.map(view => (
          <Tab
            component='div'
            disableRipple
            key={view.id}
            label={(
              <StyledButton
                startIcon={iconForViewType(view.fields.viewType)}
                onClick={handleViewClick}
                variant='text'
                size='small'
                color={activeView?.id === view.id ? 'textPrimary' : 'secondary'}
                id={view.id}
                href={!disableUpdatingUrl ? (activeView?.id === view.id ? null : getViewUrl(view.id)) : ''}
              >
                {view.title}
              </StyledButton>
            )}
            sx={{ p: 0, mb: '5px' }}
            value={view.id}
          />
        ))}
        {restViews.length !== 0 && (
          <Tab
            component='div'
            disableRipple
            sx={{ p: 0, mb: 0.5 }}
            label={(
              <Button
                variant='text'
                size='small'
                color='secondary'
                {...showViewsTriggerState}
              >
                {restViews.length} more...
              </Button>
            )}
          />
        )}
      </Tabs>
      <Menu
        anchorEl={anchorEl}
        disablePortal
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem dense onClick={handleRenameView}>
          <ListItemIcon><EditIcon fontSize='small' /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={handleViewOptions}>
          <ListItemIcon><TuneIcon fontSize='small' /></ListItemIcon>
          <ListItemText>Edit View</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={handleDuplicateView}>
          <ListItemIcon><DuplicateIcon /></ListItemIcon>
          <ListItemText>{duplicateViewText}</ListItemText>
        </MenuItem>
        {views.length !== 1 && (
          <MenuItem dense onClick={handleDeleteView}>
            <ListItemIcon><DeleteOutlineIcon fontSize='small' /></ListItemIcon>
            <ListItemText>{deleteViewText}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Menu
        {...showViewsMenuState}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 1
        }}
        >
          {restViews.map(view => {
            const content = (
              <MenuItem
                onClick={() => {
                  onViewTabClick?.(view.id);
                  showViewsMenuState.onClose();
                }}
                component='a'
                key={view.id}
                dense
              >
                <ListItemIcon>{iconForViewType(view.fields.viewType)}</ListItemIcon>
                <ListItemText>{view.title}</ListItemText>
              </MenuItem>
            );
            return disableUpdatingUrl ? content : (
              <Link
                href={getViewUrl(view.id)}
                passHref
              >
                {content}
              </Link>
            );
          })}
        </Box>
        <Divider />
        {addViewButton}
        {/* <AddViewMenu
          sx={{
            width: '100%'
          }}
          showLabel={true}
          board={board}
          activeView={activeView}
          showView={showView}
          views={views}
        /> */}
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
