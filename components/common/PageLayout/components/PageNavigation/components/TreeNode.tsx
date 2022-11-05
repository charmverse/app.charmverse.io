
import { useTreeItem } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import { useCallback, useRef, memo, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getSortedViews } from 'components/common/BoardEditor/focalboard/src/store/views';
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import useRefState from 'hooks/useRefState';
import { mergeRefs } from 'lib/utilities/react';
import type { Page } from 'models';
import { greyColor2 } from 'theme/colors';

import BoardViewTreeItem from './BoardViewTreeItem';
import PageTreeItem from './PageTreeItem';

export type MenuNode = Pick<Page, 'id' | 'spaceId' | 'title' | 'icon' | 'index' | 'parentId' | 'path' | 'type' | 'createdAt' | 'deletedAt'> & { isEmptyContent?: boolean };

export type ParentMenuNode = MenuNode & {
  children: ParentMenuNode[];
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

function DraggableTreeNode ({ item, onDropAdjacent, onDropChild, pathPrefix, addPage, deletePage, selectedNodeId }: NodeProps) {
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
      let canDropItem: boolean = true;
      // We use this to bypass the thrown error: Invariant Violation: Expected to find a valid target.
      // If there is an error thrown, set canDrop to false.
      try {
        canDropItem = monitor.canDrop();
      }
      catch {
        canDropItem = false;
      }
      return {
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: canDropItem
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

  const { focalboardViewsRecord, setFocalboardViewsRecord } = useFocalboardViews();

  const allViews = useAppSelector(getSortedViews);
  const views = allViews.filter(view => view.parentId === item.id);

  const hasSelectedChildView = views.some(view => view.id === selectedNodeId);
  const { expanded } = useTreeItem(item.id);
  const hideChildren = !expanded;

  useEffect(() => {
    const focalboardViewId = focalboardViewsRecord[item.id];
    if (views && focalboardViewId && (item.type.match(/board/)) && !views.some(view => view.id === focalboardViewId)) {
      const firstView = views[0];
      if (firstView) {
        setFocalboardViewsRecord((_focalboardViewsRecord) => ({ ..._focalboardViewsRecord, [firstView.parentId]: firstView.id }));
      }
    }
  }, [focalboardViewsRecord, views, item]);

  return (
    <PageTreeItem
      handlerId={handlerId}
      pageId={item.id}
      addSubPage={addSubPage}
      hasSelectedChildView={hasSelectedChildView}
      ref={mergeRefs([ref, drag, drop, dragPreview, focusListener])}
      label={item.title}
      href={`${pathPrefix}/${item.path}${(item.type.match(/board/)) && focalboardViewsRecord[item.id] ? `?viewId=${focalboardViewsRecord[item.id]}` : ''}`}
      isActive={isActive}
      isAdjacent={isAdjacentActive}
      isEmptyContent={item.isEmptyContent}
      labelIcon={item.icon || undefined}
      pageType={item.type as 'page'}
    >
      {hideChildren
        ? <div>{/* empty div to trick TreeView into showing expand icon */}</div>
        : (
          (item.type.match(/board/)) ? (
            views.map(view => (
              !view.fields.inline && (
                <BoardViewTreeItem
                  key={view.id}
                  href={`${pathPrefix}/${item.path}?viewId=${view.id}`}
                  label={view.title}
                  nodeId={view.id}
                  viewType={view.fields.viewType}
                />
              )
            ))
          ) : (
            item.children.length > 0
              ? item.children.map((childItem) => (
              // eslint-disable-next-line no-use-before-define
                <MemoizedTreeNode
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
          )
        )}
    </PageTreeItem>
  );
}

const MemoizedTreeNode = memo(DraggableTreeNode);

export default MemoizedTreeNode;
