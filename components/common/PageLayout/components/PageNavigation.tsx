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
import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import TreeItemContent from 'components/common/TreeItemContent';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import EmojiPicker from 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker';
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import useRefState from 'hooks/useRefState';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { isTruthy } from 'lib/utilities/types';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { Page, PageContent } from 'models';
import Link from 'next/link';
import React, { ComponentProps, Dispatch, forwardRef, ReactNode, SetStateAction, SyntheticEvent, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { greyColor2 } from 'theme/colors';
import EmojiIcon from 'components/common/Emoji';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import { IViewType } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { checkForEmpty } from 'components/common/CharmEditor/CharmEditor';
import NewPageMenu, { StyledDatabaseIcon } from './NewPageMenu';
import AddNewCard from './AddNewCard';
// based off https://codesandbox.io/s/dawn-resonance-pgefk?file=/src/Demo.js

export type MenuNode = Page & {
  children: MenuNode[];
}

export const StyledTreeItem = styled(TreeItem)(({ theme }) => ({

  position: 'relative',

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
    background: ${({ theme }) => theme.palette.action.hover};
    opacity: 0;
    position: absolute;
    top: 0px;
    right: 0px;
  }
  &:hover .page-actions {
    opacity: 1;
  }
`;

export const StyledPageIcon = styled(EmojiIcon)`
  height: 24px;
  width: 24px;
  margin-right: 4px;
  color: ${({ theme }) => theme.palette.secondary.light};
  // style focalboard icons;
  .Icon {
    height: 22px;
    width: 22px;
  }
`;

export const PageTitle = styled(Typography) <{ isempty?: number }>`
  color: inherit;
  display: flex;
  align-items: center;
  font-size: 14px;
  height: 24px;
  &:hover {
    color: inherit;
  }
  ${(props) => props.isempty && 'opacity: 0.5;'}
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: calc(80%); // hack to get ellipsis to appear
`;

interface PageLinkProps {
  children?: ReactNode;
  href: string;
  label?: string;
  labelIcon?: React.ReactNode;
  boardId?: string;
  pageId?: string;
}

export function PageLink ({ children, href, label, labelIcon, boardId, pageId }: PageLinkProps) {
  const { setPages } = usePages();
  const isempty = !label;

  function stopPropagation (event: SyntheticEvent) {
    event.stopPropagation();
  }

  const popupState = usePopupState({
    popupId: 'page-emoji',
    variant: 'popover'
  });

  return (
    <PageAnchor onClick={stopPropagation}>
      {labelIcon && (
        <StyledPageIcon icon={labelIcon} {...bindTrigger(popupState)} />
      )}
      <Link passHref href={href}>
        <PageTitle isempty={isempty ? 1 : 0}>
          {isempty ? 'Untitled' : label}
        </PageTitle>
      </Link>
      {children}
      <Menu {...bindMenu(popupState)}>
        <EmojiPicker onSelect={async (emoji) => {
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
            if (boardId) {
              await mutator.changeIcon(boardId, emoji, emoji);
            }
            popupState.close();
          }

          if (boardId) {
            await mutator.changeIcon(boardId, emoji, emoji);
          }
          popupState.close();
        }}
        />
      </Menu>
    </PageAnchor>
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

export function PageIcon ({ icon, isEditorEmpty, pageType }: { icon?: ReactNode, pageType: Page['type'], isEditorEmpty: boolean }) {

  if (icon) {
    return <StyledPageIcon icon={icon} />;
  }
  if (pageType === 'board') {
    return <StyledPageIcon icon={<StyledDatabaseIcon />} />;
  }
  else if (isEditorEmpty) {
    return <StyledPageIcon icon={<InsertDriveFileOutlinedIcon />} />;
  }
  else {
    return <StyledPageIcon icon={<DescriptionOutlinedIcon />} />;
  }
}

// eslint-disable-next-line react/function-component-definition
const PageTreeItem = forwardRef((props: any, ref) => {
  const theme = useTheme();
  const {
    addSubPage,
    deletePage,
    href,
    isAdjacent,
    isEmptyContent,
    labelIcon,
    label,
    boardId,
    pageType,
    pageId,
    hasSelectedChildView,
    ...other
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

  return (
    <>
      <StyledTreeItem
        label={(
          <PageLink
            href={href}
            label={label}
            labelIcon={Icon}
            pageId={pageId}
            boardId={boardId}
          >
            <div className='page-actions'>
              <IconButton size='small' onClick={showMenu}>
                <MoreHorizIcon color='secondary' fontSize='small' />
              </IconButton>
              {addSubPage && pageType === 'board' ? (
                <AddNewCard pageId={pageId} />
              ) : (
                <NewPageMenu tooltip='Add a page inside' addPage={page => addSubPage(page)} sx={{ marginLeft: '3px' }} />
              )}
            </div>
          </PageLink>
        )}
        ContentComponent={TreeItemComponent}
        ContentProps={{ isAdjacent, className: hasSelectedChildView ? 'Mui-selected' : undefined }}
        {...other}
        TransitionProps={{ timeout: 50 }}
        ref={ref}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={hideMenu}
        onClick={hideMenu}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem sx={{ padding: '3px 12px' }} onClick={deletePage}>
          <ListItemIcon><DeleteIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
      </Menu>
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
  item: MenuNode;
  onDropAdjacent: (a: MenuNode, b: MenuNode) => void;
  onDropChild: (a: MenuNode, b: MenuNode) => void;
  pathPrefix: string;
  addPage?: (p: Partial<Page>) => void;
  deletePage?: (id: string) => void;
  selectedNodeId: string | null;
}

function RenderDraggableNode ({ item, onDropAdjacent, onDropChild, pathPrefix, addPage, deletePage, selectedNodeId }: NodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [isAdjacent, isAdjacentRef, setIsAdjacent] = useRefState(false);
  const [{ handlerId }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId()
    })
  }));
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop (droppedItem: MenuNode, monitor) {
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

  const isActive = !isAdjacent && canDrop && isOverCurrent && !item.boardId;
  const isAdjacentActive = isAdjacent && canDrop && isOverCurrent;

  function addSubPage (page: Partial<Page>) {
    if (addPage) {
      addPage({ ...page, parentId: item.id });
    }
  }

  function deleteThisPage () {
    if (deletePage) {
      deletePage(item.id);
    }
  }

  const { focalboardViewsRecord } = useFocalboardViews();

  const isEmptyContent = checkForEmpty(item.content as PageContent);

  const viewsRecord = useAppSelector((state) => state.views.views);
  const views = Object.values(viewsRecord).filter(view => view.parentId === item.boardId);

  const hasSelectedChildView = views.some(view => view.id === selectedNodeId);

  return (
    <PageTreeItem
      data-handler-id={handlerId}
      pageId={item.id}
      addSubPage={addSubPage}
      deletePage={deleteThisPage}
      hasSelectedChildView={hasSelectedChildView}
      ref={mergeRefs([ref, drag, drop, dragPreview, focusListener])}
      nodeId={item.id}
      id={item.id}
      label={item.title}
      href={`${pathPrefix}/${item.path}${item.type === 'board' && item.boardId && focalboardViewsRecord[item.boardId] ? `?viewId=${focalboardViewsRecord[item.boardId]}` : ''}`}
      isAdjacent={isAdjacentActive}
      isEmptyContent={isEmptyContent}
      boardId={item.boardId}
      labelIcon={item.icon || undefined}
      pageType={item.type as 'page'}
      sx={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset', // 'rgba(22, 52, 71, 0.08)' : 'unset'
        position: 'relative'
        // borderTop: isAdjacentActive ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent'
      }}
    >
      {item.type === 'page' ? (
        item.children.length > 0
          ? item.children.map((childItem) => (
            <RenderDraggableNode
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

function mapTree (items: Page[], key: 'parentId', rootPageIds?: string[]): MenuNode[] {
  const pagesRecord: Record<string, Page> = {};
  const tempItems = items.map((item): MenuNode => {
    pagesRecord[item.id] = item;
    return {
      ...item,
      children: []
    };
  });
  const map: { [key: string]: number } = {};
  let node: MenuNode;
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
      if (!tempItems[index].boardId && !tempItems[index].cardId) {
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
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop (item: MenuNode, monitor) {
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
  space: Space;
  rootPageIds?: string[];
};

export default function PageNavigation ({
  deletePage,
  isFavorites,
  space,
  rootPageIds
}: NavProps) {
  const router = useRouter();
  const { pages, currentPageId, setPages, addPageAndRedirect } = usePages();
  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space.id}.expanded-pages`, []);

  const mappedItems = useMemo(() => {
    const pagesArray = Object.keys(pages).map(pageId => pages[pageId]).filter(isTruthy);
    return mapTree(pagesArray, 'parentId', rootPageIds);
  }, [pages, rootPageIds]);

  const onDropAdjacent = (droppedItem: MenuNode, containerItem: MenuNode) => {

    if (droppedItem.id === containerItem?.id) {
      return;
    }
    const parentId = containerItem.parentId;
    // console.log('onDropAdjacent:', droppedItem.title, 'to', containerItem.title);
    setPages(_pages => {
      const siblings = Object.values(_pages).filter(isTruthy).filter((page) => page && page.parentId === parentId && page.id !== droppedItem.id);
      const originIndex = siblings.findIndex((page) => page.id === containerItem.id);
      siblings.splice(originIndex, 0, droppedItem);
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
  };

  const onDropChild = (droppedItem: MenuNode, containerItem: MenuNode) => {

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
  };

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

  return (
    <TreeRoot
      setPages={setPages}
      expanded={expanded}
      // @ts-ignore - we use null instead of undefined to control the element
      selected={selectedNodeId}
      onNodeToggle={onNodeToggle}
      aria-label='items navigator'
      defaultCollapseIcon={<ExpandMoreIcon fontSize='large' />}
      defaultExpandIcon={<ChevronRightIcon fontSize='large' />}
      isFavorites={isFavorites}
      sx={{ flexGrow: isFavorites ? 0 : 1, width: '100%', overflowY: 'auto' }}
    >
      {mappedItems.map((item) => (
        <RenderDraggableNode
          key={item.id}
          item={item}
          onDropChild={(a, b) => {
            if (!item.boardId) {
              onDropChild(a, b);
            }
          }}
          onDropAdjacent={onDropAdjacent}
          pathPrefix={`/${space.domain}`}
          // pass down so parent databases can highlight themselves
          selectedNodeId={selectedNodeId}
          addPage={page => addPageAndRedirect(page)}
          deletePage={deletePage}
        />
      ))}
    </TreeRoot>
  );
}
