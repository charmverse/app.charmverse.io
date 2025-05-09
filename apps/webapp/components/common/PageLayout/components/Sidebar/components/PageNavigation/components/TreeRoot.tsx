import { useTheme } from '@emotion/react';
import type { SimpleTreeViewProps } from '@mui/x-tree-view/SimpleTreeView';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

type TreeRootProps = {
  isFavorites?: boolean;
} & SimpleTreeViewProps<true>;

export function TreeRoot({ children, isFavorites, ...rest }: TreeRootProps) {
  const ref = useRef<HTMLUListElement>(null);
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
      style={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset',
        flexGrow: isFavorites ? 0 : 1,
        overflowY: 'auto',
        width: '100%'
      }}
    >
      <SimpleTreeView {...rest} ref={ref}>
        {children}
      </SimpleTreeView>
    </div>
  );
}
