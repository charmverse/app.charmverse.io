import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';

import { PostPage } from '../PostPage/PostPage';

interface Props {
  post?: PostWithVotes | null;
  spaceId: string;
  onClose: () => void;
  open?: boolean;
}

export default function PostDialog({ post, spaceId, onClose, open }: Props) {
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'post-dialog' });
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
    if (post) {
      popupState.open();
    }
  }, [!!post]);

  // open modal when page is set
  useEffect(() => {
    if (open) {
      popupState.open();
    }
  }, [open]);

  function close() {
    popupState.close();
    onClose();
  }

  if (!popupState.isOpen) {
    return null;
  }

  return (
    <Dialog
      fullWidth
      toolbar={
        post && (
          <Box display='flex' justifyContent='space-between'>
            <Button
              size='small'
              color='secondary'
              href={`/${router.query.domain}/forum/post/${post.path}`}
              variant='text'
              startIcon={<OpenInFullIcon fontSize='small' />}
            >
              Open as Page
            </Button>
          </Box>
        )
      }
      onClose={close}
    >
      <PostPage key={post?.id} showOtherCategoryPosts post={post ?? null} spaceId={spaceId} onSave={close} />
    </Dialog>
  );
}
