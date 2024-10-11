'use client';

import { log } from '@charmverse/core/log';
import { Alert, Box } from '@mui/material';
import { useState, useEffect, useRef, useCallback } from 'react';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { LoadingCards } from 'components/common/Loading/LoadingCards';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuildersSort, CompositeCursor } from 'lib/builders/getSortedBuilders';
import { getSortedBuildersAction } from 'lib/builders/getSortedBuildersAction';
import type { BuilderInfo } from 'lib/builders/interfaces';

export function BuildersGalleryContainer({
  initialBuilders,
  showHotIcon,
  userId,
  sort,
  initialCursor
}: {
  initialCursor: CompositeCursor | null;
  initialBuilders: BuilderInfo[];
  showHotIcon: boolean;
  userId?: string;
  sort: BuildersSort;
}) {
  const [error, setError] = useState<string | null>(null);
  const isDesktop = useMdScreen();
  const [builders, setBuilders] = useState(initialBuilders);
  const [nextCursor, setNextCursor] = useState<CompositeCursor | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const loadMoreBuilders = useCallback(async () => {
    if (isLoading || error || !nextCursor?.userId) return;

    setIsLoading(true);
    try {
      const actionResponse = await getSortedBuildersAction({ sort, cursor: nextCursor });
      if (actionResponse?.data) {
        const { builders: newBuilders, nextCursor: newCursor } = actionResponse.data;
        setBuilders((prev) => [...prev, ...newBuilders]);
        setNextCursor(newCursor);
      } else if (actionResponse?.serverError) {
        setError(actionResponse.serverError.message);
        log.warn('Error fetching more builders', {
          error: actionResponse.serverError,
          sort,
          cursor: nextCursor
        });
      }
    } catch (err) {
      setError((err as Error).message);
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

    const current = observerTarget.current;

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [loadMoreBuilders, observerTarget]);

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
      {error && <Alert severity='error'>{error}</Alert>}
    </>
  );
}
