import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TreeItem, { treeItemClasses, TreeItemContentProps } from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import TreeItemContent from 'components/common/TreeItemContent';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import EmojiPicker from 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker';
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import useRefState from 'hooks/useRefState';
import { useUser } from 'hooks/useUser';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { isTruthy } from 'lib/utilities/types';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { Page, PageContent } from 'models';
import Link from 'next/link';
import React, { ComponentProps, Dispatch, forwardRef, ReactNode, SetStateAction, SyntheticEvent, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier } from 'dnd-core';
import { greyColor2 } from 'theme/colors';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import { IViewType } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { addPageAndRedirect, NewPageInput } from 'lib/pages';
import NewPageMenu from './NewPageMenu';
import { StyledPageIcon, StyledDatabaseIcon } from './PageIcon';
import PageTitle from './PageTitle';
import AddNewCard from './AddNewCard';

type MenuNode = Pick<Page, 'id' | 'title' | 'icon' | 'index' | 'parentId' | 'path' | 'type'> & { isDeletable: boolean, isEmptyContent: boolean };

export type ParentMenuNode = MenuNode & {
  children: ParentMenuNode[];
}

const StyledTreeRoot = styled(TreeRoot)<{ isFavorites?: boolean }>`
  flex-grow: ${props => props.isFavorites ? 0 : 1};
  width: 100%;
  overflow-y: auto;
`;

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
    opacity: 0;
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
  &:hover .page-actions {
    opacity: 1;
  }
  &:hover .MuiTypography-root {
    width: calc(60%);
  }
`;

interface PageLinkProps {
  children?: ReactNode;
  href: string;
  label?: string;
  labelIcon?: React.ReactNode;
  pageType?: Page['type']; // optional since we use this for views as well
  pageId?: string;
  showPicker?: boolean
}

export function PageLink ({ showPicker = true, children, href, label, labelIcon, pageType, pageId }: PageLinkProps) {

  const { setPages } = usePages();

  const popupState = usePopupState({
    popupId: 'page-emoji',
    variant: 'popover'
  });

  const isempty = !label;

  const stopPropagation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const preventDefault = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const onSelectEmoji = useCallback(async (emoji: string) => {
    if (pageId) {
      await charmClient.updatePage({
        id: pageId,
        icon: emoji
      });
      setPages(_pages => ({
        ..._pages,
        [pageId]: {
          ..._pages[pageId]!,
          icon: emoji
        }
      }));
      if (pageType === 'board') {
        mutator.changeIcon(pageId, emoji, emoji);
      }
    }
    popupState.close();
  }, [pageId, setPages]);

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
        {showPicker && (
          <Menu {...bindMenu(popupState)}>
            <EmojiPicker onSelect={onSelectEmoji} />
          </Menu>
        )}
      </PageAnchor>
    </Link>
  );
}

const TreeItemComponent = React.forwardRef<React.Ref<HTMLDivElement>, TreeItemContentProps & { isAdjacent?: boolean }>(
  ({ isAdjacent, ...props }, ref) => (
    <div style={{ position: 'relative' }}>
      <TreeItemContent {...props} ref={ref as React.Ref<HTMLDivElement>} />
      {isAdjacent && <AdjacentDropZone />}
    </div>
  )
);

const PageMenuItem = styled(MenuItem)`
  padding: 3px 12px;
  .MuiTypography-root {
    font-size: 15px;
    font-weight: 600;
  }
`;

interface PageTreeItemProps {
  addSubPage: (page: Partial<Page>) => void;
  deletePage: () => void;
  handlerId: Identifier | null; // for drag n drop
  href: string;
  isActive: boolean;
  isAdjacent: boolean;
  isDeletable: boolean;
  isEmptyContent: boolean;
  labelIcon?: string;
  label: string;
  pageType?: Page['type'];
  pageId: string;
  hasSelectedChildView: boolean;
  children: React.ReactNode;
}

// eslint-disable-next-line react/function-component-definition
const PageTreeItem = forwardRef<any, PageTreeItemProps>((props, ref) => {
  const theme = useTheme();
  const {
    addSubPage,
    children,
    deletePage,
    handlerId,
    href,
    isActive,
    isAdjacent,
    isDeletable,
    isEmptyContent,
    labelIcon,
    label,
    pageType,
    pageId,
    hasSelectedChildView
  } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  function showMenu (event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }

  function hideMenu () {
    setAnchorEl(null);
  }

  let Icon: null | ReactNode = labelIcon;

  if (!labelIcon) {
    if (pageType === 'board') {
      Icon = (<StyledDatabaseIcon />);
    }
    else if (isEmptyContent) {
      Icon = (
        <InsertDriveFileOutlinedIcon sx={{
          opacity: theme.palette.mode !== 'light' ? 0.5 : 1
        }}
        />
      );
    }
    else {
      Icon = (
        <DescriptionOutlinedIcon sx={{
          opacity: theme.palette.mode !== 'light' ? 0.5 : 1
        }}
        />
      );
    }
  }

  const ContentProps = useMemo(() => ({ isAdjacent, className: hasSelectedChildView ? 'Mui-selected' : undefined }), [isAdjacent, hasSelectedChildView]);
  const TransitionProps = useMemo(() => ({ timeout: 50 }), []);
  const anchorOrigin = useMemo(() => ({ vertical: 'bottom', horizontal: 'left' } as const), []);
  const transformOrigin = useMemo(() => ({ vertical: 'top', horizontal: 'left' } as const), []);

  const labelComponent = useMemo(() => (
    <PageLink
      href={href}
      label={label}
      labelIcon={Icon}
      pageId={pageId}
      pageType={pageType}
    >
      <div className='page-actions'>
        <IconButton size='small' onClick={showMenu}>
          <MoreHorizIcon color='secondary' fontSize='small' />
        </IconButton>
        {pageType === 'board' ? (
          <AddNewCard pageId={pageId} />
        ) : (
          <NewPageMenu tooltip='Add a page inside' addPage={addSubPage} />
        )}
      </div>
    </PageLink>
  ), [href, label, pageId, Icon, addSubPage, pageType]);

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

      {isDeletable && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={hideMenu}
          onClick={hideMenu}
          anchorOrigin={anchorOrigin}
          transformOrigin={transformOrigin}
        >
          <PageMenuItem onClick={deletePage}>
            <ListItemIcon><DeleteIcon fontSize='small' /></ListItemIcon>
            <Typography>Delete</Typography>
          </PageMenuItem>
        </Menu>
      )}
    </>
  );
});

interface BoardViewTreeItemProps {
  href: string;
  label: string;
  nodeId: string;
  viewType: IViewType;
}

const BoardViewTreeItem = forwardRef<HTMLDivElement, BoardViewTreeItemProps>((props, ref) => {
  const {
    href,
    label,
    viewType,
    nodeId
  } = props;

  const labelIcon = iconForViewType(viewType);

  return (
    <StyledTreeItem
      label={(
        <PageLink
          href={href}
          label={label}
          labelIcon={labelIcon}
          showPicker={false}
        />
      )}
      nodeId={nodeId}
      ref={ref}
      TransitionProps={{ timeout: 50 }}
    />
  );
});

// pulled from react-merge-refs
function mergeRefs (refs: any) {
  return (value: any) => {
    refs.forEach((ref: any) => {
      if (typeof ref === 'function') {
        ref(value);
      }
      else if (ref != null) {
        ref.current = value;
      }
    });
  };
}

type NodeProps = {
  item: ParentMenuNode;
  onDropAdjacent: (a: ParentMenuNode, b: ParentMenuNode) => void;
  onDropChild: (a: ParentMenuNode, b: ParentMenuNode) => void;
  pathPrefix: string;
  addPage?: (p: Partial<Page>) => void;
  deletePage?: (id: string) => void;
  selectedNodeId: string | null;
}

function RenderDraggableNode ({ item, onDropAdjacent, onDropChild, pathPrefix, addPage, deletePage, selectedNodeId }: NodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isAdjacent, isAdjacentRef, setIsAdjacent] = useRefState(false);
  const [{ handlerId }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId()
    })
  }));

  const [{ canDrop, isOverCurrent }, drop] = useDrop<ParentMenuNode, any, { canDrop: boolean, isOverCurrent: boolean }>(() => ({
    accept: 'item',
    drop (droppedItem, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      if (isAdjacentRef.current) {
        onDropAdjacent(droppedItem, item);
        setIsAdjacent(false);
      }
      else {
        onDropChild(droppedItem, item);
      }
    },

    // listen to hover events to determine if the mouse is over the top portion of the node
    hover (_item: MenuNode, monitor) {
      if (!ref.current) {
        return;
      }
      const _isOverCurrent = monitor.isOver({ shallow: true });
      let _isAdjacent = false;
      if (_isOverCurrent) {
        // Determine element rectangle on screen
        const hoverBoundingRect = ref.current!.getBoundingClientRect();
        const topOfElement = hoverBoundingRect.top;
        const threshold = topOfElement + 5;

        // Determine mouse position
        const mouseY = monitor.getClientOffset()!.y;

        if (_isOverCurrent && mouseY < threshold) {
          _isAdjacent = true;
        }

      }
      setIsAdjacent(_isAdjacent);
    },
    collect: monitor => {
      return {
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop()
      };
    }
  }));

  const focusListener = useCallback(elt => {
    elt?.addEventListener('focusin', (e: any) => {
      // Disable Treeview focus system which make draggable on TreeIten unusable
      // see https://github.com/mui-org/material-ui/issues/29518
      e.stopImmediatePropagation();
    });
    drag(elt);
  }, [drag]);

  const isActive = !isAdjacent && canDrop && isOverCurrent && item.type !== 'board';
  const isAdjacentActive = isAdjacent && canDrop && isOverCurrent;

  const addSubPage = useCallback((page: Partial<Page>) => {
    if (addPage) {
      addPage({ ...page, parentId: item.id });
    }
  }, [addPage]);

  const deleteThisPage = useCallback(() => {
    if (deletePage) {
      deletePage(item.id);
    }
  }, [deletePage]);

  const { focalboardViewsRecord } = useFocalboardViews();

  const viewsRecord = useAppSelector((state) => state.views.views);
  const views = Object.values(viewsRecord).filter(view => view.parentId === item.id);

  const hasSelectedChildView = views.some(view => view.id === selectedNodeId);

  return (
    <PageTreeItem
      handlerId={handlerId}
      pageId={item.id}
      addSubPage={addSubPage}
      deletePage={deleteThisPage}
      hasSelectedChildView={hasSelectedChildView}
      ref={mergeRefs([ref, drag, drop, dragPreview, focusListener])}
      label={item.title}
      href={`${pathPrefix}/${item.path}${item.type === 'board' && focalboardViewsRecord[item.id] ? `?viewId=${focalboardViewsRecord[item.id]}` : ''}`}
      isActive={isActive}
      isAdjacent={isAdjacentActive}
      isDeletable={item.isDeletable}
      isEmptyContent={item.isEmptyContent}
      labelIcon={item.icon || undefined}
      pageType={item.type as 'page'}
    >
      {item.type.match(/(page|card)/) ? (
        item.children.length > 0
          ? item.children.map((childItem) => (
            // eslint-disable-next-line no-use-before-define
            <MemoizedRenderDraggableNode
              onDropAdjacent={onDropAdjacent}
              onDropChild={onDropChild}
              pathPrefix={pathPrefix}
              key={childItem.id}
              item={childItem}
              addPage={addPage}
              selectedNodeId={selectedNodeId}
              deletePage={deletePage}
            />
          ))
          : (
            <Typography variant='caption' className='MuiTreeItem-content' sx={{ display: 'flex', alignItems: 'center', color: `${greyColor2} !important`, ml: 3 }}>
              No pages inside
            </Typography>
          )
      ) : views.map(view => (
        <BoardViewTreeItem
          key={view.id}
          href={`${pathPrefix}/${item.path}?viewId=${view.id}`}
          label={view.title}
          nodeId={view.id}
          viewType={view.fields.viewType}
        />
      ))}
    </PageTreeItem>
  );
}

const MemoizedRenderDraggableNode = memo(RenderDraggableNode);

function mapTree (items: MenuNode[], key: 'parentId', rootPageIds?: string[]): ParentMenuNode[] {
  const tempItems = items.map((item): ParentMenuNode => {
    return {
      ...item,
      children: []
    };
  });
  const map: { [key: string]: number } = {};
  let node: ParentMenuNode;
  const roots = [];
  let i: number;
  for (i = 0; i < tempItems.length; i += 1) {
    map[tempItems[i].id] = i; // initialize the map
  }

  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i];
    const index = node[key] ? map[node[key]!] : -1;
    if (node[key] && tempItems[index]) {
      // Make sure its not a database page or a focalboard card
      if (tempItems[index].type === 'page') {
        tempItems[index].children.push(node);
        sortArrayByObjectProperty(tempItems[index].children, 'index');
      }
    }
    else if (!rootPageIds) {
      roots.push(node);
    }
    if (rootPageIds?.includes(node.id)) {
      roots.push(node);
    }
  }

  sortArrayByObjectProperty(roots, 'index');

  return roots;
}

type TreeRootProps = {
  children: ReactNode,
  isFavorites?: boolean,
  setPages: Dispatch<SetStateAction<Record<string, Page | undefined>>>
} & ComponentProps<typeof TreeView>;

function TreeRoot ({ children, setPages, isFavorites, ...rest }: TreeRootProps) {
  const [{ canDrop, isOverCurrent }, drop] = useDrop<MenuNode, any, { canDrop: boolean, isOverCurrent: boolean }>(() => ({
    accept: 'item',
    drop (item, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop || !item.parentId) {
        return;
      }
      setPages(_pages => ({
        ..._pages,
        [item.id]: {
          ..._pages[item.id]!,
          parentId: null
        }
      }));
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  }));
  const theme = useTheme();
  const isActive = canDrop && isOverCurrent;
  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset',
        flexGrow: isFavorites ? 0 : 1
      }}
    >
      <TreeView {...rest}>{children}</TreeView>
    </div>
  );
}

type NavProps = {
  deletePage?: (id: string) => void;
  isFavorites?: boolean;
  spaceId: string;
  rootPageIds?: string[];
};

export default function PageNavigation ({
  deletePage,
  isFavorites,
  spaceId,
  rootPageIds
}: NavProps) {
  const router = useRouter();
  const { pages, currentPageId, getPagePermissions, setPages } = usePages();
  const [user] = useUser();
  const [expanded, setExpanded] = useLocalStorage<string[]>(`${spaceId}.expanded-pages`, []);

  const pagesArray: MenuNode[] = Object.values(pages)
    .filter((page): page is Page => Boolean(isTruthy(page) && (page.type === 'board' || page.type === 'page' || rootPageIds?.includes(page.id))))
    .map((page): MenuNode => ({
      id: page.id,
      title: page.title,
      icon: page.icon,
      index: page.index,
      isDeletable: getPagePermissions(page.id).delete,
      isEmptyContent: checkForEmpty(page.content as PageContent),
      parentId: page.parentId,
      path: page.path,
      type: page.type
    }));
  const pageHash = JSON.stringify(pagesArray);
  // console.log(pageHash);

  const mappedItems = useMemo(() => {
    return mapTree(pagesArray, 'parentId', rootPageIds);
  }, [pageHash, rootPageIds]);

  const onDropAdjacent = useCallback((droppedItem: ParentMenuNode, containerItem: MenuNode) => {

    if (droppedItem.id === containerItem?.id) {
      return;
    }
    const parentId = containerItem.parentId;
    // console.log('onDropAdjacent:', droppedItem.title, 'to', containerItem.title);
    setPages(_pages => {
      const siblings = Object.values(_pages).filter(isTruthy).filter((page) => page && page.parentId === parentId && page.id !== droppedItem.id);
      const originIndex = siblings.findIndex((page) => page.id === containerItem.id);
      const droppedPage = _pages[droppedItem.id];
      if (!droppedPage) {
        throw new Error('canot find dropped page');
      }
      siblings.splice(originIndex, 0, droppedPage);
      siblings.forEach((page, _index) => {
        page.index = _index;
        page.parentId = parentId;
        charmClient.updatePage({
          id: page.id,
          index: _index,
          parentId
        });
      });
      siblings.forEach(page => {
        if (_pages[page.id]) {
          _pages[page.id] = {
            ..._pages[page.id]!,
            index: page.index,
            parentId: page.parentId
          };
        }
      });
      return { ..._pages };
    });
  }, []);

  const onDropChild = useCallback((droppedItem: MenuNode, containerItem: MenuNode) => {

    if (containerItem.type === 'board') {
      return;
    }

    if (droppedItem.id === containerItem?.id) {
      return;
    }
    const index = 1000; // send it to the end
    const parentId = containerItem.id;
    // console.log('onDropChild:', droppedItem.title, 'under', containerItem.title);
    charmClient.updatePage({
      id: droppedItem.id,
      index, // send it to the end
      parentId
    });
    setPages(_pages => ({
      ..._pages,
      [droppedItem.id]: {
        ..._pages[droppedItem.id]!,
        index,
        parentId
      }
    }));
  }, []);

  useEffect(() => {
    const currentPage = pages[currentPageId];
    // expand the parent of the active page
    if (currentPage?.parentId && !isFavorites) {
      if (!expanded.includes(currentPage.parentId)) {
        setExpanded(expanded.concat(currentPage.parentId));
      }
    }
  }, [currentPageId, pages, isFavorites]);

  function onNodeToggle (event: SyntheticEvent, nodeIds: string[]) {
    setExpanded(nodeIds);
  }

  let selectedNodeId: string | null = null;
  if (currentPageId) {
    selectedNodeId = currentPageId;
    if (typeof router.query.viewId === 'string') {
      selectedNodeId = router.query.viewId;
    }
  }

  const addPage = useCallback((page: Partial<Page>) => {
    const newPage: NewPageInput = {
      ...page,
      createdBy: user!.id,
      spaceId
    };
    return addPageAndRedirect(newPage, router);
  }, []);

  return (
    <StyledTreeRoot
      setPages={setPages}
      expanded={expanded}
      // @ts-ignore - we use null instead of undefined to control the element
      selected={selectedNodeId}
      onNodeToggle={onNodeToggle}
      aria-label='items navigator'
      defaultCollapseIcon={<ExpandMoreIcon fontSize='large' />}
      defaultExpandIcon={<ChevronRightIcon fontSize='large' />}
      isFavorites={isFavorites}
    >
      {mappedItems.map((item) => (
        <MemoizedRenderDraggableNode
          key={item.id}
          item={item}
          onDropChild={onDropChild}
          onDropAdjacent={onDropAdjacent}
          pathPrefix={`/${router.query.domain}`}
          // pass down so parent databases can highlight themselves
          selectedNodeId={selectedNodeId}
          addPage={addPage}
          deletePage={deletePage}
        />
      ))}
    </StyledTreeRoot>
  );
}
