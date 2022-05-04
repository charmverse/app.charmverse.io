import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import TreeView from '@mui/lab/TreeView';
import charmClient from 'charmClient';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { isTruthy } from 'lib/utilities/types';
import { Page, PageContent } from 'models';
import { ComponentProps, Dispatch, ReactNode, SetStateAction, SyntheticEvent, useCallback, useEffect, useMemo, memo } from 'react';
import { useDrop } from 'react-dnd';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { addPageAndRedirect, NewPageInput } from 'lib/pages';
import TreeNode, { MenuNode, ParentMenuNode } from './components/TreeNode';

const StyledTreeRoot = styled(TreeRoot)<{ isFavorites?: boolean }>`
  flex-grow: ${props => props.isFavorites ? 0 : 1};
  width: 100%;
  overflow-y: auto;
`;

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
    const nodeIndex = node[key];
    const index = nodeIndex ? map[nodeIndex] : -1;
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

type PageNavigationProps = {
  deletePage?: (id: string) => void;
  isFavorites?: boolean;
  rootPageIds?: string[];
};

function PageNavigation ({
  deletePage,
  isFavorites,
  rootPageIds
}: PageNavigationProps) {
  const router = useRouter();
  const { pages, currentPageId, setPages } = usePages();
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space!.id}.expanded-pages`, []);

  const pagesArray: MenuNode[] = Object.values(pages)
    .filter((page): page is Page => Boolean(isTruthy(page) && (page.type === 'board' || page.type === 'page' || rootPageIds?.includes(page.id))))
    .map((page): MenuNode => ({
      id: page.id,
      title: page.title,
      icon: page.icon,
      index: page.index,
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
        const currentPage = _pages[page.id];
        if (currentPage) {
          _pages[page.id] = {
            ...currentPage,
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
    if (space && user) {
      const newPage: NewPageInput = {
        ...page,
        createdBy: user.id,
        spaceId: space.id
      };
      return addPageAndRedirect(newPage, router);
    }
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
        <TreeNode
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

export default memo(PageNavigation);
