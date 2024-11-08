import type { Page } from '@charmverse/core/prisma';
import Typography from '@mui/material/Typography';
import { useTreeItemState } from '@mui/x-tree-view/TreeItem';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { databaseViewsLoad } from 'components/common/DatabaseEditor/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from 'components/common/DatabaseEditor/store/hooks';
import { makeSelectSortedViews, getLoadedBoardViews } from 'components/common/DatabaseEditor/store/views';
import { useDatabaseViews } from 'hooks/useDatabaseViews';
import useRefState from 'hooks/useRefState';
import { formatViewTitle } from 'lib/databases/boardView';
import { mergeRefs } from 'lib/utils/react';
import { greyColor2 } from 'theme/colors';

import BoardViewTreeItem from './BoardViewTreeItem';
import PageTreeItem from './PageTreeItem';

export type MenuNode = Pick<
  Page,
  'id' | 'spaceId' | 'title' | 'icon' | 'index' | 'parentId' | 'path' | 'type' | 'createdAt' | 'deletedAt'
> & { isEmptyContent?: boolean };

export type ParentMenuNode = MenuNode & {
  children: ParentMenuNode[];
};

type NodeProps = {
  item: ParentMenuNode;
  onDropAdjacent: null | ((a: ParentMenuNode, b: ParentMenuNode) => void);
  onDropChild: null | ((a: ParentMenuNode, b: ParentMenuNode) => void);
  addPage?: (p: Partial<Page>) => void;
  deletePage?: (id: string) => void;
  selectedNodeId: string | null;
  onClick?: () => void;
  isFavorites?: boolean;
  validateTarget?: ({ droppedItem, targetItem }: { droppedItem: MenuNode; targetItem: MenuNode }) => boolean;
};

function DraggableTreeNode({
  item,
  onDropAdjacent,
  onDropChild,
  onClick,
  addPage,
  deletePage,
  selectedNodeId,
  validateTarget,
  isFavorites
}: NodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isAdjacent, isAdjacentRef, setIsAdjacent] = useRefState(false);
  const [{ handlerId }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId()
    })
  }));
  const dispatch = useAppDispatch();
  const loadedViews = useAppSelector(getLoadedBoardViews());

  const dndEnabled = (!!onDropAdjacent && !!onDropChild) || (isFavorites && !!onDropAdjacent);
  const [{ canDrop, isOverCurrent }, drop] = useDrop<ParentMenuNode, any, { canDrop: boolean; isOverCurrent: boolean }>(
    () => ({
      accept: 'item',
      drop(droppedItem, monitor) {
        const didDrop = monitor.didDrop();
        if (didDrop || !dndEnabled) {
          return;
        }
        if (isAdjacentRef.current) {
          onDropAdjacent?.(droppedItem, item);
          setIsAdjacent(false);
        } else {
          onDropChild?.(droppedItem, item);
        }
      },

      // listen to hover events to determine if the mouse is over the top portion of the node
      hover(_item: MenuNode, monitor) {
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
      collect: (monitor) => {
        let canDropItem: boolean = true;
        // We use this to bypass the thrown error: Invariant Violation: Expected to find a valid target.
        // If there is an error thrown, set canDrop to false.
        try {
          canDropItem = monitor.canDrop();
        } catch {
          canDropItem = false;
        }
        return {
          isOverCurrent: monitor.isOver({ shallow: true }),
          canDrop: canDropItem
        };
      },
      canDrop: (droppedItem) => {
        if (droppedItem.id === item.id || !dndEnabled) {
          return false;
        }

        if (validateTarget) {
          return validateTarget({ droppedItem, targetItem: item });
        }

        return true;
      }
    }),
    [onDropAdjacent]
  );

  const focusListener = useCallback(
    (elt: any) => {
      elt?.addEventListener('focusin', (e: any) => {
        // Disable Treeview focus system which make draggable on TreeIten unusable
        // see https://github.com/mui-org/material-ui/issues/29518
        e.stopImmediatePropagation();
      });
      drag(elt);
    },
    [drag]
  );

  const isActive = !isAdjacent && canDrop && !isFavorites && isOverCurrent && item.type !== 'board';
  const isAdjacentActive = isAdjacent && canDrop && isOverCurrent;

  const addSubPage = useCallback(
    (page: Partial<Page>) => {
      if (addPage) {
        addPage({ ...page, parentId: item.id });
      }
    },
    [item.id, addPage]
  );

  const { viewsRecord, setViewsRecord } = useDatabaseViews();

  const selectSortedViews = useMemo(makeSelectSortedViews, []);
  const views = useAppSelector((state) => selectSortedViews(state, item.id));
  const hasSelectedChildView = views.some((view) => view.id === selectedNodeId);
  const { expanded } = useTreeItemState(item.id);
  useEffect(() => {
    if (expanded && loadedViews && item.type.match(/board/) && !loadedViews[item.id]) {
      dispatch(databaseViewsLoad({ pageId: item.id }));
    }
  }, [expanded, loadedViews?.[item.id]]);

  const hideChildren = !expanded;
  useEffect(() => {
    const focalboardViewId = viewsRecord[item.id];
    if (views && focalboardViewId && item.type.match(/board/) && !views.some((view) => view.id === focalboardViewId)) {
      const firstView = views[0];
      if (firstView?.parentId) {
        setViewsRecord((_viewsRecord) => ({
          ..._viewsRecord,
          [firstView.parentId as string]: firstView.id
        }));
      }
    }
  }, [viewsRecord, views, item]);
  return (
    <PageTreeItem
      handlerId={handlerId}
      pageId={item.id}
      addSubPage={addSubPage}
      hasSelectedChildView={hasSelectedChildView}
      ref={dndEnabled ? mergeRefs([ref, drag, drop, dragPreview, focusListener]) : null}
      label={item.title}
      href={`/${item.path}${
        item.type.includes('board') && viewsRecord[item.id] ? `?viewId=${viewsRecord[item.id]}` : ''
      }`}
      pagePath={item.path}
      isActive={isActive}
      isAdjacent={isAdjacentActive}
      isEmptyContent={item.isEmptyContent}
      labelIcon={item.icon || undefined}
      pageType={item.type as 'page'}
      onClick={onClick}
    >
      {hideChildren ? (
        <div>{/* empty div to trick TreeView into showing expand icon */}</div>
      ) : item.type.match(/board/) ? (
        /* empty div to trick TreeView into showing expand icon when a board is expanded but views are not available yet */
        <div>
          {views.map(
            (view) =>
              !view.fields.inline && (
                <BoardViewTreeItem
                  key={view.id}
                  href={`${pathPrefix}/${item.path}?viewId=${view.id}`}
                  label={view.title || formatViewTitle(view)}
                  itemId={view.id}
                  viewType={view.fields.viewType}
                  onClick={onClick}
                />
              )
          )}
        </div>
      ) : item.children.length > 0 ? (
        item.children.map((childItem) => (
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
            onClick={onClick}
            validateTarget={validateTarget}
          />
        ))
      ) : (
        <Typography
          variant='caption'
          className='MuiTreeItem-content'
          sx={{ display: 'flex', alignItems: 'center', color: `${greyColor2} !important`, ml: 3 }}
        >
          No pages inside
        </Typography>
      )}
    </PageTreeItem>
  );
}

const MemoizedTreeNode = memo(DraggableTreeNode);

export default MemoizedTreeNode;
