'use client';

import { Box } from '@mui/material';
import { useState, useEffect, useRef, useCallback } from 'react';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { LoadingCards } from 'components/common/Loading/LoadingCards';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { fetchMoreBuilders } from 'lib/builders/getSortedBuildersAction';
import type { BuilderInfo } from 'lib/builders/interfaces';

export function BuildersGalleryContainer({
  initialBuilders,
  showHotIcon,
  userId,
  sort,
  initialCursor
}: {
  initialCursor: string | null;
  initialBuilders: BuilderInfo[];
  showHotIcon: boolean;
  userId?: string;
  sort: BuildersSort;
}) {
  const isDesktop = useMdScreen();
  const [builders, setBuilders] = useState(initialBuilders);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const loadMoreBuilders = useCallback(async () => {
    if (isLoading || !nextCursor) return;

    setIsLoading(true);
    try {
      const actionResponse = await fetchMoreBuilders({ sort, cursor: nextCursor });
      if (actionResponse?.data) {
        const { builders: newBuilders, nextCursor: newCursor } = actionResponse.data;
        setBuilders((prev) => [...prev, ...newBuilders]);
        setNextCursor(newCursor);
      } else if (actionResponse?.serverError) {
        // TODO: handle server error
      }
    } catch (error) {
      // TODO: handle error
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, nextCursor, sort]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreBuilders();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMoreBuilders]);

  return (
    <>
      <BuildersGallery
        builders={builders}
        showHotIcon={showHotIcon}
        size={isDesktop ? 'medium' : 'small'}
        columns={5}
        userId={userId}
      />
      {nextCursor && <div ref={observerTarget} style={{ height: '20px', width: '100%' }} />}
      {isLoading && (
        <Box my={2}>
          <LoadingCards />
        </Box>
      )}
    </>
  );
}
