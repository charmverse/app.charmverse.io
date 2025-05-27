import type { Page, PageType } from '@charmverse/core/prisma';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { styled } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import type { TreeItemContentProps } from '@mui/x-tree-view';
import { TreeItem, treeItemClasses } from '@mui/x-tree-view';
import { getSortedBoards } from '@packages/databases/store/boards';
import { useAppSelector } from '@packages/databases/store/hooks';
import type { Identifier } from 'dnd-core';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode, DragEvent, SyntheticEvent } from 'react';
import React, { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';
import Link from 'components/common/Link';
import { AddToFavoritesAction } from 'components/common/PageActions/components/AddToFavoritesAction';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { DuplicatePageAction } from 'components/common/PageActions/components/DuplicatePageAction';
import { SetAsHomePageAction } from 'components/common/PageActions/components/SetAsHomePageAction';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { greyColor2 } from 'theme/colors';

import { PageIcon } from '../../../../../../PageIcon';
import PageTitle from '../../../../PageTitle';
import { StyledIconButton } from '../../AddIconButton';

import AddNewCard from './AddNewCard';
import NewPageMenu from './NewPageMenu';
import TreeItemContent from './TreeItemContent';

// disable hover UX on ios which converts first click to a hover event

interface PageTreeItemProps {
  addSubPage: (page: Partial<Page>) => void;
  handlerId: Identifier | null; // for drag n drop
  href: string;
  isActive: boolean;
  isAdjacent: boolean;
  isEmptyContent?: boolean;
  labelIcon?: string;
  label: string;
  pageType: PageType;
  pageId: string;
  pagePath: string;
  hasSelectedChildView: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const StyledTreeItem = styled(TreeItem, { shouldForwardProp: (prop) => prop !== 'isActive' })<{
  isActive?: boolean;
}>(({ isActive, theme }) => ({
  position: 'relative',
  backgroundColor: isActive ? theme.palette.action.focus : 'unset',
  marginLeft: 3,
  marginRight: 3,
  // unset margin on child tree items
  '.MuiTreeItem-root': {
    marginLeft: 0,
    marginRight: 0
  },

  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    marginBottom: 1,
    '.MuiTypography-root': {
      fontWeight: 500
    },
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.Mui-selected:hover::after': {
      content: '""',
      left: 0,
      top: 0,
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: theme.palette.action.hover,
      pointerEvents: 'none'
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: theme.palette.action.selected,
      color: theme.palette.text.primary,
      '.MuiTypography-root': {
        fontWeight: 700
      }
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      paddingLeft: 0,
      color: 'inherit'
    },
    [`& .${treeItemClasses.iconContainer}`]: {
      marginRight: 0,
      width: '24px'
    },
    [`& .${treeItemClasses.iconContainer} svg`]: {
      color: greyColor2
    },
    [`& .${treeItemClasses.iconContainer} svg.MuiSvgIcon-fontSizeLarge`]: {
      fontSize: 24
    }
  }
}));

const AdjacentDropZone = styled.div`
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background-color: ${({ theme }) => theme.palette.primary.main};
`;

const PageAnchor = styled(Link)`
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 2px 0;
  position: relative;

  .page-icon {
    font-size: 14px;
  }
  svg {
    font-size: 20px;
  }

  .page-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 0px;
    top: 0px;
    right: 0px;
    .MuiIconButton-root {
      padding: 0;
      border-radius: 2px;
      height: 20px;
      width: 20px;
    }
  }

  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      min-height: 38px;
      width: 100%;
      padding-right: 62px;

      .page-actions {
        gap: 6px;
        .MuiIconButton-root {
          height: 26px;
          width: 26px;
        }
      }
    }
  `}

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .page-actions {
      opacity: 0;
    }
    &:hover .page-actions {
      opacity: 1;
    }
    &:hover .MuiTypography-root {
      width: calc(60%);
    }
  }
`;

interface PageLinkProps {
  children?: ReactNode;
  href: string;
  label?: string;
  labelIcon?: ReactNode;
  isEmptyContent?: boolean;
  pageType: Page['type'];
  pageId?: string;
  showPicker?: boolean;
  onClick?: () => void;
}

export function PageLink({
  showPicker = true,
  children,
  href,
  isEmptyContent,
  label,
  labelIcon,
  pageType,
  pageId,
  onClick
}: PageLinkProps) {
  const popupState = usePopupState({
    popupId: `page-emoji-${pageId}`,
    variant: 'popover'
  });

  const [iconClicked, setIconClicked] = useState(false);
  const { data: permissions } = useSWRImmutable(iconClicked && pageId ? `check-page-permissions-${pageId}` : null, () =>
    charmClient.permissions.pages.computePagePermissions({ pageIdOrPath: pageId as string })
  );

  const isempty = !label;

  const stopPropagation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const preventDefault = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const onDragStart = useCallback(
    (event: DragEvent) => {
      event.dataTransfer.setData('sidebar-page', JSON.stringify({ pageId, pageType }));
    },
    [pageId, pageType]
  );

  const triggerState = bindTrigger(popupState);

  function handleIconClicked(ev: any) {
    triggerState.onClick(ev);
    setIconClicked(ev);
  }

  return (
    <PageAnchor href={href} onClick={stopPropagation} color='inherit' onDragStart={onDragStart}>
      <span className='page-icon' onClick={preventDefault}>
        <PageIcon
          pageType={pageType}
          isEditorEmpty={isEmptyContent}
          icon={labelIcon}
          {...triggerState}
          onClick={showPicker ? handleIconClicked : undefined}
        />
      </span>
      <PageTitle hasContent={isempty} onClick={onClick}>
        {isempty ? 'Untitled' : label}
      </PageTitle>
      {children}
      {/* check for strict false so that we optimistically show the popup in the normal case */}
      {showPicker && pageId && permissions?.edit_content !== false && (
        <EmojiMenu popupState={popupState} pageId={pageId} />
      )}
    </PageAnchor>
  );
}

function EmojiMenu({ popupState, pageId }: { popupState: any; pageId: string }) {
  const onSelectEmoji = useCallback(
    async (emoji: string) => {
      charmClient.pages.updatePage({ id: pageId, icon: emoji });
      popupState.close();
    },
    [pageId]
  );

  return (
    <Menu
      {...bindMenu(popupState)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <CustomEmojiPicker onUpdate={onSelectEmoji} />
    </Menu>
  );
}

const TreeItemComponent = React.forwardRef<
  HTMLDivElement,
  TreeItemContentProps & { isAdjacent?: boolean; hasSelectedChildView?: boolean }
>(({ isAdjacent, ...props }, ref) => (
  <div id={`page-navigation-${props.itemId}`} style={{ position: 'relative' }}>
    <TreeItemContent {...props} ref={ref} />
    {isAdjacent && <AdjacentDropZone />}
  </div>
));

// eslint-disable-next-line react/function-component-definition
const PageTreeItem = forwardRef<any, PageTreeItemProps>((props, ref) => {
  const {
    addSubPage,
    children,
    handlerId,
    href,
    isActive,
    isAdjacent,
    isEmptyContent,
    labelIcon,
    label,
    pageType,
    pageId,
    pagePath,
    hasSelectedChildView,
    onClick
  } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const showMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }, []);

  function closeMenu() {
    setAnchorEl(null);
  }

  const ContentProps = useMemo(() => ({ isAdjacent, hasSelectedChildView }), [isAdjacent, hasSelectedChildView]);
  const TransitionProps = useMemo(() => ({ timeout: 50 }), []);
  const anchorOrigin = useMemo(() => ({ vertical: 'bottom', horizontal: 'left' }) as const, []);
  const transformOrigin = useMemo(() => ({ vertical: 'top', horizontal: 'left' }) as const, []);

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const labelComponent = useMemo(
    () => (
      <PageLink
        isEmptyContent={isEmptyContent}
        href={href}
        label={label}
        labelIcon={labelIcon}
        pageId={pageId}
        pageType={pageType}
        onClick={onClick}
      >
        <div className='page-actions'>
          <StyledIconButton size='small' onClick={showMenu}>
            <MoreHorizIcon color='secondary' fontSize='small' />
          </StyledIconButton>

          {userSpacePermissions?.createPage && pageType === 'board' && <AddNewCard pageId={pageId} />}
          {userSpacePermissions?.createPage && pageType === 'page' && (
            <NewPageMenu tooltip='Add a page inside' addPage={addSubPage} />
          )}
        </div>
      </PageLink>
    ),
    [href, label, pageId, labelIcon, addSubPage, pageType, userSpacePermissions?.createPage]
  );

  return (
    <>
      <StyledTreeItem
        id={pageId}
        data-handler-id={handlerId}
        isActive={isActive}
        label={labelComponent}
        itemId={pageId}
        // @ts-ignore
        ContentComponent={TreeItemComponent}
        // @ts-ignore
        ContentProps={ContentProps}
        slotProps={{
          groupTransition: TransitionProps
        }}
        ref={ref}
        data-test={`page-tree-item-${pageId}`}
      >
        {children}
      </StyledTreeItem>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        onClick={closeMenu}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        {Boolean(anchorEl) && <PageItemActionsMenu closeMenu={closeMenu} pageId={pageId} pagePath={pagePath} />}
      </Menu>
    </>
  );
});

function PageItemActionsMenu({
  closeMenu,
  pageId,
  pagePath
}: {
  closeMenu: () => void;
  pageId: string;
  pagePath: string;
}) {
  const boards = useAppSelector(getSortedBoards);
  const currentPage = usePageFromPath();
  const { deletePage, pages } = usePages();
  const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: pageId });
  const { navigateToSpacePath } = useCharmRouter();
  const deletePageDisabled = !pagePermissions?.delete;
  const page = pages[pageId];
  async function deletePageWithBoard() {
    if (deletePageDisabled) {
      return;
    }

    const board = boards.find((b) => b.id === page?.id);
    const newPage = await deletePage({
      board,
      pageId
    });

    if (!currentPage && newPage) {
      // If we are in a page that doesn't exist, redirect user to the created page
      navigateToSpacePath(`/${newPage.path}`);
    }
  }

  return (
    <>
      <Tooltip arrow placement='top' title={deletePageDisabled ? 'You do not have permission to delete this page' : ''}>
        <div>
          <ListItemButton dense disabled={deletePageDisabled} onClick={deletePageWithBoard}>
            <ListItemIcon>
              <DeleteOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </ListItemButton>
        </div>
      </Tooltip>
      <AddToFavoritesAction pageId={pageId} onComplete={closeMenu} />
      <SetAsHomePageAction pageId={pageId} onComplete={closeMenu} />
      <DuplicatePageAction
        pageId={pageId}
        pageType={page?.type}
        pagePermissions={pagePermissions}
        onComplete={closeMenu}
      />
      <CopyPageLinkAction path={`/${pagePath}`} onComplete={closeMenu} />
    </>
  );
}

export default memo(PageTreeItem);
