'use client';

import { log } from '@charmverse/core/log';
import { Alert, Box } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { BuildersGallery } from '@packages/scoutgame-ui/components/common/Gallery/BuildersGallery';
import { LoadingCards } from '@packages/scoutgame-ui/components/common/Loading/LoadingCards';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useState, useEffect, useRef, useCallback } from 'react';

import type { CompositeCursor } from 'lib/builders/getPaginatedBuilders';
import { getPaginatedBuildersAction } from 'lib/builders/getPaginatedBuildersAction';

export function BuildersGalleryContainer({
  initialBuilders,
  showHotIcon,
  initialCursor
}: {
  initialCursor: CompositeCursor | null;
  initialBuilders: BuilderInfo[];
  showHotIcon: boolean;
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
      const actionResponse = await getPaginatedBuildersAction({ cursor: nextCursor });
      if (actionResponse?.data) {
        const { builders: newBuilders, nextCursor: newCursor } = actionResponse.data;
        setBuilders((prev) => [...prev, ...newBuilders]);
        setNextCursor(newCursor);
      } else if (actionResponse?.serverError) {
        setError(actionResponse.serverError.message);
        log.warn('Error fetching more builders', {
          error: actionResponse.serverError,
          cursor: nextCursor
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, nextCursor]);

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
      <BuildersGallery builders={builders} showHotIcon={showHotIcon} size={isDesktop ? 'large' : 'small'} columns={3} />
      {nextCursor && <div ref={observerTarget} style={{ height: '50px', width: '100%' }} />}
      {isLoading && (
        <Box my={2}>
          <LoadingCards count={3} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
    </>
  );
}
