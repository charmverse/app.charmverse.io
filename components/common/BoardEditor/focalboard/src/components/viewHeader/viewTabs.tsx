import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Edit as EditIcon,
  Tune as TuneIcon,
  DeleteOutline as DeleteOutlineIcon,
  ContentCopy as DuplicateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Typography, Box, Stack } from '@mui/material';
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
import { capitalize } from 'lodash';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';

import { publishIncrementalUpdate } from 'components/common/BoardEditor/publisher';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import type { Board } from 'lib/focalboard/board';
import type { BoardView, IViewType } from 'lib/focalboard/boardView';
import { formatViewTitle, createBoardView } from 'lib/focalboard/boardView';
import { isTruthy } from 'lib/utilities/types';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import AddViewMenu from '../addViewMenu';
import { iconForViewType } from '../viewMenu';

// fix types for MUI Tab to include Button Props
const TabButton = Tab as React.ComponentType<TabProps & ButtonProps>;

const StyledTabContent = styled(Typography)`
  padding: ${({ theme }) => theme.spacing('6px', '2px', '6px')};
  width: 100%;

  span {
    display: inline-flex;
    gap: 4px;
    border-radius: 4px;
    padding: 4px 8px;
    width: 100%;
  }
  &:hover span {
    background-color: var(--button-text-hover);
  }
`;

interface ViewTabsProps {
  intl: IntlShape;
  activeView?: BoardView | null;
  board: Board;
  readOnly?: boolean;
  views: BoardView[];
  showView: (viewId: string) => void;
  addViewButton?: ReactNode;
  onDeleteView?: (viewId: string) => void;
  onClickNewView?: () => void;
  disableUpdatingUrl?: boolean;
  maxTabsShown: number;
  openViewOptions: () => void;
  readOnlyViewIds?: string[];
  supportedViewTypes?: IViewType[];
}

function ViewMenuItem({
  view,
  onClick,
  onDrop,
  href,
  selected
}: {
  selected?: boolean;
  href: string;
  onDrop: (currentView: BoardView, dropzoneView: BoardView) => void;
  view: BoardView;
  onClick: VoidFunction;
}) {
  const hrefProps = href ? { href, component: Link } : {};
  const [isDragging, isOver, columnRef] = useSortable('view', view, true, onDrop);
  return (
    <Stack
      ref={columnRef}
      sx={{
        overflow: 'unset',
        opacity: isDragging ? 0.5 : 1,
        transition: `background-color 150ms ease-in-out`,
        backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial',
        flexDirection: 'row'
      }}
    >
      <MenuItem
        onClick={onClick}
        key={view.id}
        dense
        className={isOver ? 'dragover' : ''}
        sx={{ width: '100%' }}
        selected={selected}
        {...hrefProps}
      >
        <DragIndicatorIcon color='secondary' fontSize='small' sx={{ mr: 1 }} />
        <ListItemIcon>{iconForViewType(view.fields.viewType)}</ListItemIcon>
        <ListItemText>{view.title || formatViewTitle(view)}</ListItemText>
      </MenuItem>
    </Stack>
  );
}

function ViewTab({
  view,
  onClick,
  onDrop,
  href,
  isActive
}: {
  isActive: boolean;
  href?: string;
  onDrop: (currentView: BoardView, dropzoneView: BoardView) => void;
  view: BoardView;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}) {
  const theme = useTheme();
  const [isDragging, isOver, columnRef] = useSortable<BoardView, HTMLButtonElement>('view', view, true, onDrop);
  return (
    <TabButton
      ref={columnRef as any}
      disableRipple
      href={href}
      onClick={onClick}
      variant='text'
      size='small'
      data-view-id={view.id}
      sx={{
        p: 0,
        overflow: 'unset',
        opacity: isDragging ? 0.5 : 1,
        transition: `background-color 150ms ease-in-out`,
        backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial',
        flexDirection: 'row',
        // The tab indicator is not shown anymore since its located in a separate component
        borderBottom: `1px solid ${isActive ? theme.palette.text.primary : 'transparent'}`
      }}
      label={
        <StyledTabContent
          color={isActive ? 'textPrimary' : 'secondary'}
          display='flex'
          alignItems='center'
          fontSize='small'
          fontWeight={500}
          gap={1}
        >
          <span>
            {iconForViewType(view.fields.viewType)}
            {view.title || formatViewTitle(view)}
          </span>
        </StyledTabContent>
      }
    />
  );
}

function ViewTabs(props: ViewTabsProps) {
  const {
    onDeleteView,
    openViewOptions,
    maxTabsShown,
    disableUpdatingUrl,
    activeView,
    board,
    intl,
    readOnly,
    showView,
    views: viewsProp,
    readOnlyViewIds,
    supportedViewTypes
  } = props;
  const router = useRouter();
  const [viewMenuAnchorEl, setViewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [dropdownView, setDropdownView] = useState<BoardView | null>(null);
  const renameViewPopupState = usePopupState({ variant: 'popover', popupId: 'rename-view-popup' });
  const hiddenViewsPopupState = usePopupState({ variant: 'popover', popupId: 'show-views-popup' });
  const resetGoogleForms = usePopupState({ variant: 'popover', popupId: 'reset-google-forms' });
  const showViewsTriggerState = bindTrigger(hiddenViewsPopupState);
  const showViewsMenuState = bindMenu(hiddenViewsPopupState);

  const views = viewsProp.filter((view) => !view.fields.inline);
  const viewIds = views.map((view) => view.id);
  const viewsRecord = viewsProp.reduce((acc, view) => {
    acc[view.id] = view;
    return acc;
  }, {} as Record<string, BoardView>);
  // Find the index of the current view
  const currentViewIndex = viewIds.findIndex((viewId) => viewId === activeView?.id);
  const shownViews = views.slice(0, maxTabsShown);
  let restViews = views.slice(maxTabsShown);

  // If the current view index is more than what we can show in the screen
  if (currentViewIndex >= maxTabsShown) {
    const replacedView = shownViews[maxTabsShown - 1];
    // Replace the current view as the last view of the shown views
    shownViews[maxTabsShown - 1] = views[currentViewIndex];
    restViews = restViews.filter((view) => view.id !== activeView?.id);
    restViews.unshift(replacedView);
  }

  const { register, handleSubmit, setValue } = useForm<{ title: string }>({
    defaultValues: { title: dropdownView?.title || '' }
  });

  function handleViewClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    event.preventDefault();
    const selectedViewId = event.currentTarget.dataset.viewId;
    const view = selectedViewId && viewsRecord[selectedViewId];
    if (!view) {
      return;
    }
    if (view && !readOnly && selectedViewId === activeView?.id && !readOnlyViewIds?.includes(selectedViewId)) {
      setViewMenuAnchorEl(event.currentTarget);
      setDropdownView(view);
    } else {
      showView(selectedViewId);
    }
  }

  function handleClose() {
    hiddenViewsPopupState.close();
  }

  function closeViewMenu() {
    setViewMenuAnchorEl(null);
  }

  function getViewUrl(viewId: string) {
    const pathWithoutQuery = router.asPath.split('?')[0];
    return `${pathWithoutQuery}?viewId=${viewId}`;
  }

  const handleDuplicateView = useCallback(async () => {
    if (!dropdownView) return;
    const newView = createBoardView(dropdownView);
    newView.title = `${dropdownView.title || `${capitalize(dropdownView.fields.viewType)} view`} copy`;
    newView.id = Utils.createGuid(IDType.View);
    await mutator.insertBlock(
      newView,
      'duplicate view',
      async (block) => {
        showView(block.id);
      },
      async () => {
        showView(dropdownView.id);
      }
    );

    await mutator.patchBlock(
      board.id,
      { updatedFields: { viewIds: [...viewIds, newView.id] } },
      publishIncrementalUpdate
    );
    closeViewMenu();
    handleClose();
  }, [dropdownView, showView, board.id, viewIds]);

  const handleDeleteView = useCallback(async () => {
    Utils.log('deleteView');
    if (!dropdownView) return;

    setViewMenuAnchorEl(null);
    const nextViewId = viewIds.find((viewId) => viewId !== dropdownView.id);
    await mutator.deleteBlock(dropdownView, 'delete view');
    await mutator.patchBlock(
      board.id,
      { updatedFields: { viewIds: viewIds.filter((viewId) => viewId !== dropdownView.id) } },
      publishIncrementalUpdate
    );
    onDeleteView?.(dropdownView.id);
    if (nextViewId) {
      showView(nextViewId);
    }
  }, [viewIds, dropdownView, showView, onDeleteView, board.id]);

  function resyncGoogleFormData() {
    if (dropdownView) {
      const newView = createBoardView(dropdownView);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { boardId, ...sourceDataWithoutBoard } = newView.fields.sourceData!;
      newView.fields.sourceData = sourceDataWithoutBoard;
      mutator.updateBlock(newView, dropdownView, 'reset Google view source');
      setViewMenuAnchorEl(null);
      resetGoogleForms.close();
    }
  }

  function handleRenameView() {
    setViewMenuAnchorEl(null);
    renameViewPopupState.open();
  }

  function handleViewOptions() {
    openViewOptions();
    setViewMenuAnchorEl(null);
  }

  function saveViewTitle(form: { title: string }) {
    if (dropdownView) {
      mutator.changeTitle(dropdownView.id, dropdownView.title, form.title);
      renameViewPopupState.close();
    }
  }

  async function reorderViews(droppedView: BoardView, dropzoneView: BoardView) {
    await mutator.changeBoardViewsOrder(board.id, viewIds, droppedView, dropzoneView);
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
        value={false} // use false to disable the indicator
        sx={{ minHeight: 0, mb: '-5px' }}
      >
        {shownViews
          .map((view) => {
            return (
              <ViewTab
                onClick={handleViewClick}
                onDrop={reorderViews}
                view={view}
                isActive={activeView?.id === view.id}
                key={view.id}
                href={activeView?.id === view.id ? undefined : getViewUrl(view.id)}
              />
            );
          })
          .filter(isTruthy)}
        {restViews.length !== 0 && (
          <TabButton
            disableRipple
            sx={{ p: 0 }}
            {...showViewsTriggerState}
            label={
              <StyledTabContent color='secondary' fontSize='small' fontWeight={500}>
                <span>{restViews.length} more...</span>
              </StyledTabContent>
            }
          />
        )}
      </Tabs>
      <Menu anchorEl={viewMenuAnchorEl} open={Boolean(viewMenuAnchorEl)} onClose={closeViewMenu}>
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
          <MenuItem key='duplicate-view' dense onClick={resetGoogleForms.open}>
            <ListItemIcon>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText>Resync data with Google Forms</ListItemText>
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
        {viewIds.length !== 1 && (
          <MenuItem dense onClick={handleDeleteView}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>{deleteViewText}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Menu {...showViewsMenuState}>
        {viewIds.map(
          (viewId) =>
            viewsRecord[viewId] && (
              <ViewMenuItem
                selected={viewId === activeView?.id}
                view={viewsRecord[viewId]}
                key={viewsRecord[viewId].id}
                href={disableUpdatingUrl ? '' : getViewUrl(viewsRecord[viewId].id)}
                onClick={() => {
                  showView(viewsRecord[viewId].id);
                  showViewsMenuState.onClose();
                }}
                onDrop={reorderViews}
              />
            )
        )}
        <Divider sx={{ my: 1 }} />
        <Box pl='14px'>
          {activeView && (
            <AddViewMenu
              board={board}
              activeView={activeView}
              views={views}
              showView={showView}
              showLabel={true}
              onClose={handleClose}
              onClick={props.onClickNewView}
              supportedViewTypes={supportedViewTypes}
            />
          )}
        </Box>
      </Menu>
      <ConfirmDeleteModal
        title='Resync form and responses'
        onClose={resetGoogleForms.close}
        open={resetGoogleForms.isOpen}
        buttonText='Resync cards'
        question='This action will replace existing cards and properties including custom settings and cannot be undone. Continue?'
        onConfirm={resyncGoogleFormData}
      />

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
