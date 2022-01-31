import React, { forwardRef, ReactNode, ComponentProps, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import styled from '@emotion/styled';
import { useDrop, useDrag, DragSourceMonitor, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import { Page } from 'models';
import EmojiCon from '../Emoji';

export type MenuNode = Page & {
  children: MenuNode[];
}

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    // borderTopRightRadius: theme.spacing(2),
    // borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)'
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit'
    }
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2)
    }
  }
}));

type TreeItemProps = ComponentProps<typeof TreeItem> & {
  labelIcon?: string;
}

// eslint-disable-next-line react/function-component-definition
const StyledTreeItem = forwardRef((props: TreeItemProps, ref) => {
  const {
    color,
    labelIcon,
    label,
    ...other
  } = props;

  return (
    <StyledTreeItemRoot
      label={(
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, px: 0 }}>
          <EmojiCon sx={{ display: 'inline-block', fontSize: 14, fontWeight: 500, width: 20 }}>
            {labelIcon || '📄 '}
          </EmojiCon>
          <Typography sx={{ fontSize: 14, fontWeight: 500, flexGrow: 1 }}>
            {label}
          </Typography>
        </Box>
      )}
      // style={{
      //   '--tree-view-color': color,
      //   //'--tree-view-bg-color': bgColor,
      // }}
      {...other}
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

function RenderDraggableNode ({ item, onDrop }: { item: MenuNode, onDrop: (a: MenuNode, b: MenuNode) => void }) {
  // rgba(22, 52, 71, 0.08)
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
  return (
    <StyledTreeItem
      ref={mergeRefs([drag, drop, dragPreview, focusListener])}
      key={item.id}
      nodeId={item.id}
      label={item.title}
      labelIcon={item.icon}
      sx={{
        backgroundColor: isActive ? 'rgba(22, 52, 71, 0.08)' : 'unset'
      }}
    >
      {isDragging
        ? null
        : item.children?.length > 0
          ? item.children.map((childItem, index) => (
            <RenderDraggableNode
              onDrop={onDrop}
              key={childItem.id}
              item={childItem}
            />
          ))
          : null}
    </StyledTreeItem>
  );
}

function mapTree (items: Page[], key: 'parentId'): MenuNode[] {
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
      // @ts-ignore if you have dangling branches check that map[node.parentId] exists
      tempItems[index].children.push(node);
    }
    else {
      roots.push(node);
    }
  }
  return roots;
}

function TreeRoot ({ children, setPages, ...rest }:
  { children: ReactNode, setPages: Dispatch<SetStateAction<Page[]>> } & ComponentProps<typeof TreeView>) {
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
  const isActive = canDrop && isOverCurrent;
  return (
    <div
      ref={drop}
      style={{
        height: '100%',
        backgroundColor: isActive ? 'rgba(22, 52, 71, 0.08)' : 'unset'
      }}
    >
      <TreeView {...rest}>{children}</TreeView>
    </div>
  );
}

export default function PageNavigation ({ pages, setPages }:
    { pages: Page[], setPages: Dispatch<SetStateAction<Page[]>> }) {
  const nodes = pages.map(page => ({
    id: page.id,
    disabled: false,
    parentId: page.parentId || null
  }));
  const mappedItems = useMemo(() => mapTree(pages, 'parentId'), [nodes]);
  const onDrop = (droppedItem: MenuNode, containerItem: MenuNode) => {
    setPages(stateNodes => stateNodes.map(stateNode => {
      if (stateNode.id === droppedItem.id) {
        return {
          ...stateNode,
          parentId: containerItem.id
        };
      }
      else {
        return stateNode;
      }
    }));
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <TreeRoot
        setPages={setPages}
        defaultExpanded={nodes
          .filter((item) => item.disabled)
          .map((item) => item.id)}
        defaultSelected={nodes
          .filter((item) => item.disabled)
          .map((item) => item.id)}
        aria-label='items navigator'
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{ height: '100%', flexGrow: 1, width: '100%', overflowY: 'auto' }}
      >
        {mappedItems.map((item, index) => (
          <RenderDraggableNode key={item.id} item={item} onDrop={onDrop} />
        ))}
      </TreeRoot>
    </DndProvider>
  );
}
