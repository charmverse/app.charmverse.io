import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { TreeItemContentProps } from '@mui/lab/TreeItem';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import type { Page, PageType } from '@prisma/client';
import type { Identifier } from 'dnd-core';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';
import type { ReactNode, SyntheticEvent } from 'react';
import React, { forwardRef, memo, useCallback, useMemo } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import EmojiPicker from 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker';
import TreeItemContent from 'components/common/TreeItemContent';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { getKey } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { isTouchScreen } from 'lib/utilities/browser';
import { greyColor2 } from 'theme/colors';

import AddNewCard from '../../AddNewCard';
import NewPageMenu from '../../NewPageMenu';
import { StyledDatabaseIcon, StyledPageIcon } from '../../PageIcon';
import PageTitle from '../../PageTitle';

interface PageTreeItemProps {
  addSubPage: (page: Partial<Page>) => void;
  handlerId: Identifier | null; // for drag n drop
  href: string;
  isActive: boolean;
  isAdjacent: boolean;
  isEmptyContent?: boolean;
  labelIcon?: string;
  label: string;
  pageType?: PageType;
  pageId: string;
  hasSelectedChildView: boolean;
  children: React.ReactNode;
}

export const StyledTreeItem = styled(TreeItem, { shouldForwardProp: prop => prop !== 'isActive' })<{ isActive?: boolean }>(({ isActive, theme }) => ({

  position: 'relative',
  backgroundColor: isActive ? theme.palette.action.focus : 'unset',

  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    // paddingRight: theme.spacing(1),
    // fontWeight: theme.typography.fontWeightMedium,
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
      color: 'inherit'
    },
    [`& .${treeItemClasses.iconContainer}`]: {
      marginRight: 0,
      width: '28px'
    },
    [`& .${treeItemClasses.iconContainer} svg`]: {
      color: greyColor2,
      marginLeft: 12
    },
    [`& .${treeItemClasses.iconContainer} svg.MuiSvgIcon-fontSizeLarge`]: {
      fontSize: 24
    }
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(3)
    },
    // add increasing indentation to children of children
    [`& .${treeItemClasses.group} .${treeItemClasses.content}`]: {
      paddingLeft: `calc(${theme.spacing(3)} + 16px)`
    },
    [`& .${treeItemClasses.group} .${treeItemClasses.group} .${treeItemClasses.content}`]: {
      paddingLeft: `calc(${theme.spacing(3)} + 32px)`
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

const PageAnchor = styled.a`
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 2px 0;
  position: relative;

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
  labelIcon?: React.ReactNode;
  pageType?: Page['type']; // optional since we use this for views as well
  pageId?: string;
  showPicker?: boolean;
}

export function PageLink ({ showPicker = !isTouchScreen(), children, href, label, labelIcon, pageType, pageId }: PageLinkProps) {

  const popupState = usePopupState({
    popupId: 'page-emoji',
    variant: 'popover'
  });

  const isempty = !label;

  const stopPropagation = useCallback((event: SyntheticEvent) => {
    const pageNavigationElement = document.querySelector('.page-navigation');
    if (pageNavigationElement) {
      localStorage.setItem(getKey('sidebar-scroll-top'), pageNavigationElement.scrollTop.toString());
    }
    event.stopPropagation();
  }, []);

  const preventDefault = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const triggerState = bindTrigger(popupState);

  return (
    <Link passHref href={href}>
      <PageAnchor onClick={stopPropagation}>
        {labelIcon && (
          <span onClick={preventDefault}>
            <StyledPageIcon icon={labelIcon} {...triggerState} onClick={showPicker ? triggerState.onClick : undefined} />
          </span>
        )}
        <PageTitle hasContent={isempty}>
          {isempty ? 'Untitled' : label}
        </PageTitle>
        {children}
        {showPicker && pageId && <EmojiMenu popupState={popupState} pageId={pageId} pageType={pageType} />}
      </PageAnchor>
    </Link>
  );
}

function EmojiMenu ({ popupState, pageId, pageType }: { popupState: any, pageId: string, pageType?: Page['type'] }) {
  const { updatePage } = usePages();
  const onSelectEmoji = useCallback(async (emoji: string) => {
    if (pageId) {
      updatePage({ id: pageId, icon: emoji });

      if (pageType === 'board') {
        mutator.changeIcon(pageId, emoji, emoji);
      }
    }
    popupState.close();
  }, [pageId, updatePage]);

  return (
    <Menu
      {...bindMenu(popupState)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <EmojiPicker onSelect={onSelectEmoji} />
    </Menu>
  );
}

const TreeItemComponent = React.forwardRef<React.Ref<HTMLDivElement>, TreeItemContentProps & { isAdjacent?: boolean }>(
  ({ isAdjacent, ...props }, ref) => (
    <div id={`page-navigation-${props.nodeId}`} style={{ position: 'relative' }}>
      <TreeItemContent {...props} ref={ref as React.Ref<HTMLDivElement>} />
      {isAdjacent && <AdjacentDropZone />}
    </div>
  )
);

const MemoizedIconButton = memo(IconButton);

const PageMenuItem = styled(ListItemButton)`
  .MuiTypography-root {
    font-weight: 600;
  }
`;

// eslint-disable-next-line react/function-component-definition
const PageTreeItem = forwardRef<any, PageTreeItemProps>((props, ref) => {
  const theme = useTheme();
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
    hasSelectedChildView
  } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const showMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }, []);

  function closeMenu () {
    setAnchorEl(null);
  }

  const icon = useMemo(() => {
    if (labelIcon) {
      return labelIcon;
    }
    else if (pageType === 'board') {
      return (<StyledDatabaseIcon />);
    }
    else if (isEmptyContent) {
      return (
        <InsertDriveFileOutlinedIcon sx={{
          opacity: theme.palette.mode !== 'light' ? 0.5 : 1
        }}
        />
      );
    }
    else {
      return (
        <DescriptionOutlinedIcon sx={{
          opacity: theme.palette.mode !== 'light' ? 0.5 : 1
        }}
        />
      );
    }
  }, [labelIcon, pageType, isEmptyContent]);

  const ContentProps = useMemo(() => ({ isAdjacent, className: hasSelectedChildView ? 'Mui-selected' : undefined }), [isAdjacent, hasSelectedChildView]);
  const TransitionProps = useMemo(() => ({ timeout: 50 }), []);
  const anchorOrigin = useMemo(() => ({ vertical: 'bottom', horizontal: 'left' } as const), []);
  const transformOrigin = useMemo(() => ({ vertical: 'top', horizontal: 'left' } as const), []);

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const labelComponent = useMemo(() => (
    <PageLink
      href={href}
      label={label}
      labelIcon={icon}
      pageId={pageId}
      pageType={pageType}
    >
      <div className='page-actions'>
        <MemoizedIconButton size='small' onClick={showMenu}>
          <MoreHorizIcon color='secondary' fontSize='small' />
        </MemoizedIconButton>

        {
          userSpacePermissions?.createPage && (
            pageType === 'board' ? (
              <AddNewCard pageId={pageId} />
            ) : (
              <NewPageMenu tooltip='Add a page inside' addPage={addSubPage} />
            )
          )
        }

      </div>
    </PageLink>
  ), [href, label, pageId, icon, addSubPage, pageType, userSpacePermissions?.createPage]);

  return (
    <>
      <StyledTreeItem
        data-handler-id={handlerId}
        isActive={isActive}
        label={labelComponent}
        nodeId={pageId}
        // @ts-ignore
        ContentComponent={TreeItemComponent}
        ContentProps={ContentProps}
        TransitionProps={TransitionProps}
        ref={ref}
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
        {Boolean(anchorEl) && <PageActionsMenu closeMenu={closeMenu} pageId={pageId} pagePath={href} />}
      </Menu>
    </>
  );
});

function PageActionsMenu ({ closeMenu, pageId, pagePath }: { closeMenu: () => void, pageId: string, pagePath: string }) {
  const boards = useAppSelector(getSortedBoards);
  const { deletePage, getPagePermissions, pages } = usePages();
  const { showMessage } = useSnackbar();
  const permissions = getPagePermissions(pageId);

  const deletePageDisabled = !permissions.delete;

  async function deletePageWithBoard () {
    if (deletePageDisabled) {
      return;
    }
    const page = pages[pageId];
    const board = boards.find(b => b.id === page?.id);

    await deletePage({
      board,
      pageId
    });
  }

  function onCopy () {
    closeMenu();
    showMessage('Link copied to clipboard');
  }

  function getAbsolutePath () {
    if (typeof window !== 'undefined') {
      return window.location.origin + pagePath;
    }
    return '';
  }

  return (
    <>
      <Tooltip arrow placement='top' title={deletePageDisabled ? 'You do not have permission to delete this page' : ''}>
        <div>
          <PageMenuItem dense disabled={deletePageDisabled} onClick={deletePageWithBoard}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </PageMenuItem>
        </div>
      </Tooltip>
      <CopyToClipboard text={getAbsolutePath()} onCopy={() => onCopy()}>
        <PageMenuItem dense>
          <ListItemIcon><ContentCopyIcon fontSize='small' /></ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </PageMenuItem>
      </CopyToClipboard>
    </>
  );
}

export default memo(PageTreeItem);
