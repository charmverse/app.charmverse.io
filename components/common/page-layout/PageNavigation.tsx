import React, { forwardRef, ReactNode, ComponentProps, useCallback, useMemo, useState, useEffect, Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useDrop, useDrag, DndProvider } from 'react-dnd';
import { useRouter } from 'next/router';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import AddIcon from '@mui/icons-material/AddBoxOutlined';
import ArticleIcon from '@mui/icons-material/InsertDriveFileOutlined';
import Typography from '@mui/material/Typography';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import Link from 'next/link';
import { blackColor, greyColor2 } from 'theme/colors';
import { Page } from 'models';
import { useLocalStorage } from 'hooks/useLocalStorage';
import EmojiCon from '../Emoji';

// based off https://codesandbox.io/s/dawn-resonance-pgefk?file=/src/Demo.js

export type MenuNode = Page & {
  children: MenuNode[];
}

const DefaultPageIcon = styled(ArticleIcon)`
  color: ${greyColor2};
  opacity: 0.5;
  font-size: 22px;
`;

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({

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
    [`& .${treeItemClasses.iconContainer} svg`]: {
      color: greyColor2,
      fontSize: 24,
      marginLeft: 12
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

const StyledTreeItemContent = styled.a`
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 3px 0;
  position: relative;

  .page-actions {
    background: ${({ theme }) => theme.palette.action.hover};
    display: none;
    position: absolute;
    padding-top: 6px;
    right: 0;
  }
  &:hover .page-actions {
    display: block;
  }
`;

const StyledPageIcon = styled(EmojiCon)`
  display: flex;
  align-items: center;
  color: black;
  font-size: 14px;
  height: 24px;
  width: 24px;
`;

const StyledLink = styled(Typography)`
  color: inherit;
  font-size: 14px;
  &:hover {
    color: inherit;
  }
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: calc(80%); // hack to get ellipsis to appear
`;

type TreeItemProps = ComponentProps<typeof TreeItem> & {
  href: string;
  labelIcon?: string;
  addSubPage?: () => void;
}

// eslint-disable-next-line react/function-component-definition
const StyledTreeItem = forwardRef((props: TreeItemProps, ref) => {
  const {
    addSubPage,
    color,
    href,
    labelIcon,
    label,
    ...other
  } = props;

  function stopPropagation (event: SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <StyledTreeItemRoot
      label={(
        <Link href={href} passHref>
          <StyledTreeItemContent onClick={stopPropagation}>
            <StyledPageIcon>
              {labelIcon || <DefaultPageIcon />}
            </StyledPageIcon>
            <StyledLink>
              {label}
            </StyledLink>
            <div className='page-actions'>
              {addSubPage && <AddIcon color='secondary' fontSize='small' onClick={() => addSubPage()} />}
            </div>
          </StyledTreeItemContent>
        </Link>
      )}
      {...other}
      TransitionProps={{ timeout: 50 }}
      ref={ref}
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

type DraggableNodeProps = {
  item: MenuNode;
  onDrop: (a: MenuNode, b: MenuNode) => void;
  pathPrefix: string;
  addPage?: (p: Partial<Page>) => void;
}

function RenderDraggableNode ({ item, onDrop, pathPrefix, addPage }: DraggableNodeProps) {

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

  function addSubPage () {
    if (addPage) {
      addPage({ parentId: item.id });
    }
  }

  return (
    <StyledTreeItem
      addSubPage={addSubPage}
      ref={mergeRefs([drag, drop, dragPreview, focusListener])}
      key={item.id}
      nodeId={item.id}
      label={item.title}
      href={`${pathPrefix}/${item.path}`}
      labelIcon={item.icon}
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
            />
          ))
          : (
            <Typography variant='caption' className='MuiTreeItem-content' sx={{ color: `${greyColor2} !important`, ml: 1 }}>
              No pages inside
            </Typography>
          )}
    </StyledTreeItem>
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
  addPage?: (p: Partial<Page>) => void;
  isFavorites?: boolean;
  pages: Page[];
  pathPrefix: string;
  rootPageIds?: string[];
  setPages: Dispatch<SetStateAction<Page[]>>;
  spaceId: string;
};

export default function PageNavigation ({
  addPage,
  isFavorites,
  pages,
  pathPrefix,
  rootPageIds,
  setPages,
  spaceId
}: NavProps) {

  const [expanded, setExpanded] = useLocalStorage<string[]>(`${spaceId}.expanded-pages`, []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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
      if (router.asPath === `${pathPrefix}/${page.path}`) {
        // expand the parent of the active page
        if (!isFavorites && page.parentId) {
          if (!expanded.includes(page.parentId)) {
            setExpanded(expanded.concat(page.parentId));
          }
        }
        if (!selectedNodeId) {
          setSelectedNodeId(page.id);
        }
      }
    }
  }, []);

  function onNodeToggle (event: SyntheticEvent, nodeIds: string[]) {
    setExpanded(nodeIds);
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <TreeRoot
        setPages={setPages}
        expanded={expanded}
        // @ts-ignore - we use null instead of undefined to control the element
        selected={selectedNodeId}
        onNodeToggle={onNodeToggle}
        aria-label='items navigator'
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        isFavorites={isFavorites}
        sx={{ flexGrow: isFavorites ? 0 : 1, width: '100%', overflowY: 'auto' }}
      >
        {mappedItems.map((item, index) => (
          <RenderDraggableNode key={item.id} item={item} onDrop={onDrop} pathPrefix={pathPrefix} addPage={addPage} />
        ))}
      </TreeRoot>
    </DndProvider>
  );
}
