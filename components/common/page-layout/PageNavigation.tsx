import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Space } from '@prisma/client';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ComponentProps, Dispatch, forwardRef, ReactNode, SetStateAction, SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { greyColor2 } from 'theme/colors';
import { Page } from 'models';
import { useLocalStorage } from 'hooks/useLocalStorage';
import NewPageMenu, { StyledArticleIcon, StyledDatabaseIcon } from '../NewPageMenu';
import EmojiCon from '../Emoji';

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
  const {
    addSubPage,
    deletePage,
    color,
    href,
    labelIcon,
    label,
    pageType,
    ...other
  } = props;

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
            labelIcon={labelIcon || (pageType === 'board' ? <StyledDatabaseIcon /> : <StyledArticleIcon />)}
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
  onDrop: (a: MenuNode, b: MenuNode) => void;
  pathPrefix: string;
  addPage?: (p: Partial<Page>) => void;
  deletePage?: (id: string) => void;
}

function RenderDraggableNode ({ item, onDrop, pathPrefix, addPage, deletePage }: DraggableNodeProps) {

  const theme = useTheme();
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
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
      onDrop(droppedItem, item);
    },
    collect: monitor => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  }));

  const focusListener = useCallback(elt => {
    elt?.addEventListener('focusin', (e: any) => {
      // Disable Treeview focus system which make draggable on TreeIten unusable
      // see https://github.com/mui-org/material-ui/issues/29518
      e.stopImmediatePropagation();
    });
    drag(elt);
  }, [drag]);

  const isActive = canDrop && isOverCurrent;

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
      addSubPage={addSubPage}
      deletePage={deleteThisPage}
      ref={mergeRefs([drag, drop, dragPreview, focusListener])}
      key={item.id}
      nodeId={item.id}
      label={item.title}
      href={`${pathPrefix}/${item.path}`}
      labelIcon={item.icon || undefined}
      pageType={item.type as 'page'}
      sx={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset', // 'rgba(22, 52, 71, 0.08)' : 'unset'
        position: 'relative'
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
    </PageTreeItem>
  );
}

function mapTree (items: Page[], key: 'parentId', rootPageIds?: string[]): MenuNode[] {
  const tempItems = items.map(item => {
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
      // @ts-ignore
      tempItems[index].children.push(node);
    }
    else if (!rootPageIds) {
      roots.push(node);
    }
    if (rootPageIds?.includes(node.id)) {
      roots.push(node);
    }
  }
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
  addPage?: (s: Space, p: Partial<Page>) => void;
  deletePage?: (id: string) => void;
  isFavorites?: boolean;
  pages: Page[];
  currentPage: Page | null;
  space: Space;
  rootPageIds?: string[];
  setPages: Dispatch<SetStateAction<Page[]>>;
};

export default function PageNavigation ({
  addPage,
  deletePage,
  isFavorites,
  pages,
  currentPage,
  space,
  rootPageIds,
  setPages
}: NavProps) {

  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space.id}.expanded-pages`, []);
  const mappedItems = useMemo(() => mapTree(pages, 'parentId', rootPageIds), [pages, rootPageIds]);

  const onDrop = (droppedItem: MenuNode, containerItem: MenuNode) => {
    setPages(stateNodes => stateNodes.map(stateNode => {
      if (stateNode.id === droppedItem.id && droppedItem.id !== containerItem.id) {
        return {
          ...stateNode,
          parentId: containerItem.id
        };
      }
      else {
        return stateNode;
      }
    }));
    // collapse the dropped node
    setExpanded(state => {
      return state.filter(id => id !== droppedItem.id);
    });
  };

  const router = useRouter();

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
          addPage={page => addPage && addPage(space, page)}
          deletePage={deletePage}
        />
      ))}
    </TreeRoot>
  );
}
