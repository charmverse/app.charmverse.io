import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';

import charmClient from 'charmClient';
import DocumentPage from 'components/[pageId]/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import log from 'lib/log';
import type { PageUpdates } from 'lib/pages';
import debouncePromise from 'lib/utilities/debouncePromise';

import { PageActions } from '../PageActions';

interface Props {
  page?: ForumPostPage | null;
  onClose: () => void;
}

export default function PostDialog(props: Props) {
  const { page } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'post-dialog' });
  const { user } = useUser();
  const router = useRouter();

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // open modal when page is set
  useEffect(() => {
    if (page) {
      popupState.open();
    }
  }, [!!page]);

  async function onClickDelete() {
    if (page) {
      await charmClient.forum.deleteForumPost(page.id);
      onClose();
    }
  }

  function onClose() {
    popupState.close();
    props.onClose();
  }

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    if (page) {
      await charmClient.forum.updateForumPost(page.id, updates);
    }
  }, 500);

  const setPage = useCallback(
    async (updates: Partial<Page>) => {
      if (!page || !mounted.current) {
        return;
      }
      debouncedPageUpdate({ id: page.id, ...updates } as Partial<Page>).catch((err: any) => {
        log.error('Error saving page', err);
      });
    },
    [page]
  );

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog
          hideCloseButton
          toolsMenu={
            page && (
              <PageActions
                page={page}
                onClickDelete={
                  user?.id === page.createdBy
                    ? () => {
                        onClickDelete();
                      }
                    : undefined
                }
              />
            )
          }
          toolbar={
            <Box display='flex' justifyContent='space-between'>
              <Button
                size='small'
                color='secondary'
                href={`/${router.query.domain}/${page?.path}`}
                variant='text'
                startIcon={<OpenInFullIcon fontSize='small' />}
              >
                Open as Page
              </Button>
            </Box>
          }
          onClose={onClose}
        >
          {page && (
            <DocumentPage
              insideModal
              page={{
                ...page,
                permissions:
                  user?.id === page.createdBy
                    ? [
                        {
                          id: '',
                          userId: user.id,
                          pageId: page.id,
                          permissionLevel: 'full_access',
                          spaceId: null,
                          roleId: null,
                          permissions: [],
                          public: false
                        }
                      ]
                    : []
              }}
              setPage={setPage}
            />
          )}
        </Dialog>
      )}
    </RootPortal>
  );
}
