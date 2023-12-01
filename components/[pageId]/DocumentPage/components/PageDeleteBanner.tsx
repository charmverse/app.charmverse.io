import type { PageType } from '@charmverse/core/prisma-client';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { StyledBanner } from 'components/common/Banners/Banner';
import { initialDatabaseLoad } from 'components/common/BoardEditor/focalboard/src/store/databaseBlocksLoad';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

export default function PageDeleteBanner({ pageType, pageId }: { pageType: PageType; pageId: string }) {
  const [isMutating, setIsMutating] = useState(false);
  const { space } = useCurrentSpace();
  const { navigateToSpacePath } = useCharmRouter();
  const { pages } = usePages();
  const { sendMessage } = useWebSocketClient();
  const dispatch = useAppDispatch();
  const { showMessage } = useSnackbar();
  const { permissions } = usePagePermissions({ pageIdOrPath: pageId });

  async function restorePage() {
    if (space) {
      try {
        await charmClient.restorePage(pageId);

        if (pageType === 'page' || pageType === 'board') {
          sendMessage({
            payload: {
              id: pageId
            },
            type: 'page_restored'
          });
        }

        await mutate(`pages/${space.id}`);
        dispatch(initialDatabaseLoad({ pageId }));
      } catch (err) {
        showMessage((err as any).message ?? 'Could not restore page', 'error');
        // TODO: handle error
      } finally {
        setIsMutating(false);
      }
    }
  }

  async function deletePage() {
    const path = Object.values(pages).find((page) => page?.type !== 'card' && !page?.deletedAt)?.path;
    if (path) {
      await navigateToSpacePath(`/${path}`);
      await charmClient.deletePage(pageId);
    }
  }

  return (
    <StyledBanner errorBackground>
      <Box display='flex' gap={1} alignItems='center' data-test='archived-page-banner'>
        <div
          style={{
            color: 'white',
            fontWeight: 600
          }}
        >
          This page is in Trash
        </div>
        <Button
          data-test='banner--restore-archived-page'
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await restorePage();
            setIsMutating(false);
          }}
          variant='outlined'
          size='small'
        >
          Restore Page
        </Button>
        <Button
          data-test='banner--permanently-delete'
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await deletePage();
            setIsMutating(false);
          }}
          variant='outlined'
          size='small'
        >
          Delete permanently
        </Button>
      </Box>
    </StyledBanner>
  );
}
