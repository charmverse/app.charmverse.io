import { useTheme } from '@emotion/react';
import TreeView from '@mui/lab/TreeView';
import { useRouter } from 'next/router';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type TreeRootProps = {
  children: ReactNode;
  isFavorites?: boolean;
} & ComponentProps<typeof TreeView>;

export function TreeRoot({ children, isFavorites, ...rest }: TreeRootProps) {
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
