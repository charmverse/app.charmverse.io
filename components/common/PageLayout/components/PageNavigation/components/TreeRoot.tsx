import { useTheme } from '@emotion/react';
import TreeView from '@mui/lab/TreeView';
import { useRouter } from 'next/router';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';

import type { MenuNode } from 'components/common/PageLayout/components/PageNavigation/components/TreeNode';
import type { PageUpdates } from 'lib/pages';

type TreeRootProps = {
  children: ReactNode;
  isFavorites?: boolean;
  mutatePage: (page: PageUpdates) => void;
} & ComponentProps<typeof TreeView>;

export function TreeRoot({ children, mutatePage, isFavorites, ...rest }: TreeRootProps) {
  // const [{ canDrop, isOverCurrent }, drop] = useDrop<MenuNode, any, { canDrop: boolean; isOverCurrent: boolean }>(
  //   () => ({
  //     accept: 'item',
  //     drop(item, monitor) {
  //       const didDrop = monitor.didDrop();
  //       if (didDrop || !item.parentId) {
  //         return;
  //       }

  //       mutatePage({ id: item.id, parentId: null });
  //     },
  //     collect: (monitor) => ({
  //       isOverCurrent: monitor.isOver({ shallow: true }),
  //       canDrop: false
  //     })
  //   })
  // );
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const theme = useTheme();
  const isActive = false;

  // Need to wait for the child nodes to appear before we can start scrolling
  const hasChildrenLoaded = !!(children as any[]).length;

  useEffect(() => {
    const { pageId } = router.query;
    if (hasChildrenLoaded && pageId) {
      const anchor = document.querySelector(`a[href^="/${router.query.domain}/${pageId}"]`);
      if (anchor) {
        setTimeout(() => {
          anchor.scrollIntoView({
            behavior: 'smooth'
          });
        });
      }
    }
  }, [hasChildrenLoaded]);

  return (
    <div
      // ref={drop}
      style={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset',
        flexGrow: isFavorites ? 0 : 1,
        overflowY: 'auto',
        width: '100%'
      }}
    >
      <TreeView {...rest} ref={ref}>
        {children}
      </TreeView>
    </div>
  );
}
