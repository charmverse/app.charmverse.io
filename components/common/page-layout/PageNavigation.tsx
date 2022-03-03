import React, { useRef, ComponentProps, Dispatch, forwardRef, ReactNode, SetStateAction, SyntheticEvent, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '@emotion/react';
import update from 'immutability-helper';
import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import Link from 'next/link';
import { useDrag, useDrop } from 'react-dnd';
import type { XYCoord } from 'dnd-core';
import { greyColor2 } from 'theme/colors';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import EmojiCon from '../Emoji';
import NewPageMenu, { StyledDatabaseIcon } from '../NewPageMenu';

// based off https://codesandbox.io/s/dawn-resonance-pgefk?file=/src/Demo.js

export type MenuNode = Page & {
  children: MenuNode[];
  index: number;
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
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: ${({ theme }) => theme.palette.primary.main};
`;
export const StyledIconButton = styled(IconButton)`
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  height: 16px;
  width: 16px;
  svg {
    font-size: 16px;
  }
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
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

const PageIcon = styled(EmojiCon)`
  height: 24px;
  width: 24px;
  margin-right: 4px;
`;

export const PageTitle = styled(Typography)<{isempty: number}>`
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
}

export function PageLink ({ children, href, label, labelIcon }: PageLinkProps) {

  const isempty = !label;

  function stopPropagation (event: SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <Link href={href} passHref>
      <PageAnchor onClick={stopPropagation}>
        {labelIcon && (
          <PageIcon>
            {labelIcon}
          </PageIcon>
        )}
        <PageTitle isempty={isempty ? 1 : 0}>
          {isempty ? 'Untitled' : label}
        </PageTitle>
        {children}
      </PageAnchor>
    </Link>
  );
}

// eslint-disable-next-line react/function-component-definition
const PageTreeItem = forwardRef((props: any, ref) => {
  const { pages } = usePages();
  const {
    addSubPage,
    deletePage,
    color,
    href,
    labelIcon,
    label,
    pageType,
    pageId,
    ...other
  } = props;

  const referencedPage = pages.find(_page => _page.id === pageId);

  const docContent = ((referencedPage?.content) as PageContent)?.content;

  const isEditorEmpty = docContent && (docContent.length <= 1
  && (!docContent[0] || (docContent[0] as PageContent)?.content?.length === 0));

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  function stopPropagation (event: SyntheticEvent) {
    event.stopPropagation();
  }

  function showMenu (event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }

  function hideMenu (event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(null);
  }

  return (
    <>
      <StyledTreeItem
        label={(
          <PageLink
            href={href}
            label={label}
            labelIcon={labelIcon || (pageType === 'board' ? <StyledDatabaseIcon /> : (isEditorEmpty ? (
              <InsertDriveFileOutlinedIcon sx={{
                opacity: 0.5
              }}
              />
            ) : (
              <DescriptionOutlinedIcon sx={{
                opacity: 0.5
              }}
              />
            )))}
          >
            <div className='page-actions'>
              <IconButton size='small' onClick={showMenu}>
                <MoreHorizIcon color='secondary' fontSize='small' />
              </IconButton>
              {addSubPage && (
                <NewPageMenu tooltip='Add a page inside' addPage={page => addSubPage(page)} sx={{ marginLeft: '3px' }} />
              )}
            </div>
          </PageLink>
        )}
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

type DraggableNodeProps = {
  item: MenuNode;
  onDrop: (a: MenuNode, b: MenuNode, c?: number, d?: number) => void;
  pathPrefix: string;
  addPage?: (p: Partial<Page>) => void;
  deletePage?: (id: string) => void;
}

function RenderDraggableNode ({ item, onDrop, pathPrefix, addPage, deletePage }: DraggableNodeProps) {

  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId()
    })
  }));
  const [{ canDrop, isAdjacent, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop (droppedItem: MenuNode, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      onDrop(droppedItem, item);
    },

    // hover (_item: MenuNode, monitor) {
    //   if (!ref.current) {
    //     return;
    //   }
    //   const isAdjacent = false;
    //   if (isOverCurrent) {
    //     const dragIndex = _item.index;
    //     const hoverIndex = item.index;

    //     // Don't replace items with themselves
    //     if (dragIndex === hoverIndex) {
    //       return;
    //     }

    //     // Determine rectangle on screen
    //     const hoverBoundingRect = ref.current?.getBoundingClientRect();

    //     // Get vertical middle
    //     const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    //     // Determine mouse position
    //     const clientOffset = monitor.getClientOffset();

    //     // Get pixels to the top
    //     const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

    //     // Only perform the move when the mouse has crossed half of the items height
    //     // When dragging downwards, only move when the cursor is below 50%
    //     // When dragging upwards, only move when the cursor is above 50%

    //     // Dragging downwards
    //     if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
    //       return;
    //     }

    //     // Dragging upwards
    //     if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
    //       return;
    //     }
    //   }

    //   // Time to actually perform the action
    //   // moveCard(dragIndex, hoverIndex);
    //   console.log('move node', { title: item.title, current: item.index, _title: item.title, _current: _item.index, isAdjacent, dragIndex, hoverIndex });

    //   // Note: we're mutating the monitored item here!
    //   // Generally it's better to avoid mutations,
    //   // but it's good here for the sake of performance
    //   // to avoid expensive index searches.
    //   _item.index = hoverIndex;
    // },
    collect: monitor => {
      console.log('collect!', item.title);
      const _isOverCurrent = monitor.isOver({ shallow: true });
      let _isAdjacent = false;
      if (_isOverCurrent) {

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current!.getBoundingClientRect();
        const topOfElement = hoverBoundingRect.top;
        console.log('hoverBoundingRect', hoverBoundingRect.bottom, hoverBoundingRect.top);
        const threshold = topOfElement + 10;
        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
        console.log(hoverClientY, threshold);
        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging upwards
        if (hoverClientY > threshold) {
          console.log('adjacent', hoverClientY, hoverMiddleY);
          _isAdjacent = true;
        }
      }

      return {
        isOverCurrent: _isOverCurrent,
        isAdjacent: _isAdjacent,
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

  const isActive = !isAdjacent && canDrop && isOverCurrent;
  if (isOverCurrent || isAdjacent) {
    console.log('isOverCurrent', isActive, isAdjacent, item.title);
  }

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

  return (
    <PageTreeItem
      pageId={item.id}
      addSubPage={addSubPage}
      deletePage={deleteThisPage}
      ref={mergeRefs([ref, drag, drop, dragPreview, focusListener])}
      key={item.id}
      nodeId={item.id}
      label={item.title}
      href={`${pathPrefix}/${item.path}`}
      labelIcon={item.icon || undefined}
      pageType={item.type as 'page'}
      sx={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset', // 'rgba(22, 52, 71, 0.08)' : 'unset'
        position: 'relative',
        borderTop: isAdjacent ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent'
      }}
    >
      {isDragging
        ? null
        : item.children?.length > 0
          ? item.children.map((childItem, index) => (
            <RenderDraggableNode
              onDrop={onDrop}
              pathPrefix={pathPrefix}
              key={childItem.id}
              item={childItem}
              addPage={addPage}
              deletePage={deletePage}
            />
          ))
          : (
            <Typography variant='caption' className='MuiTreeItem-content' sx={{ display: 'flex', alignItems: 'center', color: `${greyColor2} !important`, ml: 3 }}>
              No pages inside
            </Typography>
          )}
      {isAdjacent && <AdjacentDropZone />}
    </PageTreeItem>
  );
}

function mapTree (items: Page[], key: 'parentId', rootPageIds?: string[]): MenuNode[] {
  const tempItems = items.map((item, index): MenuNode => {
    return {
      ...item,
      children: [],
      index
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
      tempItems[index].children.push(node);
      sortArrayByObjectProperty(tempItems[index].children, 'index');
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
  setPages: Dispatch<SetStateAction<Page[]>>
} & ComponentProps<typeof TreeView>;

function TreeRoot ({ children, setPages, isFavorites, ...rest }: TreeRootProps) {
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop (item: MenuNode, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop || !item.parentId) {
        return;
      }
      setPages((stateNodes) => stateNodes.map((stateNode) => {
        if (stateNode.id === item.id) {
          return {
            ...stateNode,
            parentId: null
          };
        }
        else {
          return stateNode;
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
  const { pages, currentPage, setPages, addPage } = usePages();

  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space.id}.expanded-pages`, []);
  const mappedItems = useMemo(() => mapTree(pages, 'parentId', rootPageIds), [pages, rootPageIds]);
  console.log('items:\n', mappedItems.map(i => `${i.index} - ${i.title || 'Untitled'}`).join('\n'));
  const onDrop = (droppedItem: MenuNode, containerItem: MenuNode | null, originIndex?: number, newIndex?: number) => {

    if (droppedItem.id === containerItem?.id) {
      return;
    }
    const index = newIndex || droppedItem.index;
    const parentId = containerItem?.id || droppedItem.parentId;
    console.log('onDrop', index, parentId, droppedItem);
    charmClient.updatePage({
      id: droppedItem.id,
      index,
      parentId
    });
    setPages(stateNodes => {
      const newNodes = stateNodes.map(stateNode => {
        if (stateNode.id === droppedItem.id) {
          return {
            ...stateNode,
            index,
            parentId
          };
        }
        else {
          return stateNode;
        }
      });
      console.log('update page order', originIndex, newIndex);
      if (originIndex && newIndex) {
        return update(newNodes, {
          $splice: [
            [originIndex, 1],
            [newIndex, 0, stateNodes[originIndex] as MenuNode]
          ]
        });
      }
      else {
        return newNodes;
      }
    });
    // collapse the dropped node
    setExpanded(state => {
      return state.filter(id => id !== droppedItem.id);
    });
  };

  useEffect(() => {
    for (const page of pages) {
      if (currentPage?.id === page.id) {
        // expand the parent of the active page
        if (!isFavorites && page.parentId) {
          if (!expanded.includes(page.parentId)) {
            setExpanded(expanded.concat(page.parentId));
          }
        }
      }
    }
  }, [currentPage]);

  function onNodeToggle (event: SyntheticEvent, nodeIds: string[]) {
    setExpanded(nodeIds);
  }

  return (
    <TreeRoot
      setPages={setPages}
      expanded={expanded}
      // @ts-ignore - we use null instead of undefined to control the element
      selected={currentPage?.id || null}
      onNodeToggle={onNodeToggle}
      aria-label='items navigator'
      defaultCollapseIcon={<ExpandMoreIcon fontSize='large' />}
      defaultExpandIcon={<ChevronRightIcon fontSize='large' />}
      isFavorites={isFavorites}
      sx={{ flexGrow: isFavorites ? 0 : 1, width: '100%', overflowY: 'auto', pb: 3 }}
    >
      {mappedItems.map((item, index) => (
        <RenderDraggableNode
          key={item.id}
          item={item}
          onDrop={onDrop}
          pathPrefix={`/${space.domain}`}
          addPage={page => addPage && addPage(page)}
          deletePage={deletePage}
        />
      ))}
    </TreeRoot>
  );
}
