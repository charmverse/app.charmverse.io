import type { Post, PostCategory } from '@charmverse/core/prisma';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Card, DialogContent, Stack, Typography } from '@mui/material';
import MuiDialog from '@mui/material/Dialog';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { trackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import Dialog from 'components/common/DatabaseEditor/components/dialog';
import { DialogTitle } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { FullPageActionsMenuButton } from 'components/common/PageActions/FullPageActionsMenuButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useUser } from 'hooks/useUser';
import type { PostWithVotes } from '@packages/lib/forums/posts/interfaces';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';

import type { FormInputs } from '../interfaces';
import { DraftPostList } from '../PostList/DraftPostList';
import { PostPage } from '../PostPage/PostPage';

import { usePostDialog } from './hooks/usePostDialog';

interface Props {
  post?: PostWithVotes | null;
  isLoading: boolean;
  spaceId?: string;
  onClose: () => void;
  newPostCategory?: PostCategory | null;
}

const emptyPost: FormInputs = {
  title: '',
  content: null,
  contentText: ''
};

export function PostDialog({ post, isLoading, spaceId, onClose, newPostCategory }: Props) {
  const mounted = useRef(false);
  const router = useRouter();
  const [formInputs, setFormInputs] = useState<FormInputs | undefined>(isLoading ? undefined : emptyPost);
  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { space } = useCurrentSpace();
  const { user } = useUser();
  // only load drafts if user is logged in
  const {
    data: draftedPosts = [],
    isLoading: isDraftsLoading,
    mutate: mutateDraftPosts
  } = useSWR(spaceId && user ? `${spaceId}/drafted-posts` : null, () =>
    charmClient.forum.listDraftPosts({ spaceId: spaceId! })
  );

  const { showPost, createPost } = usePostDialog();
  const isMobile = useSmallScreen();

  const [isDraftPostListOpen, setIsDraftPostListOpen] = useState(false);

  function close() {
    onClose();
    setFormInputs({ title: '', content: null, contentText: '' });
    setContentUpdated(false);
    setShowConfirmDialog(false);
    setIsDraftPostListOpen(false);
  }

  function showDraftPost(draftPost: Post) {
    setIsDraftPostListOpen(false);
    onClose();
    showPost({
      postId: draftPost.id,
      onClose() {
        setUrlWithoutRerender(router.pathname, { postId: null });
      }
    });
    setUrlWithoutRerender(router.pathname, { postId: draftPost.id });
  }

  function deleteDraftPost(postId: string) {
    charmClient.forum.deleteForumPost(postId).then(() => {
      mutateDraftPosts(
        (_posts) => {
          if (_posts) {
            return _posts.filter((_post) => _post.id !== postId);
          }
          return [];
        },
        { revalidate: false }
      );
      if (spaceId && post?.id === postId) {
        createPost({ spaceId, category: newPostCategory || null });
      }
    });
  }

  const relativePath = post ? `/${router.query.domain}/forum/post/${post?.path}` : null;

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (spaceId && post?.id && space) {
      trackPageView({
        spaceId,
        postId: post.id,
        type: 'post',
        spaceDomain: space.domain,
        spaceCustomDomain: space.customDomain
      });
      if (space.domain === 'op-grants') {
        charmClient.track.trackActionOp('page_view', {
          type: 'post',
          path: post.path,
          url: window.location.href
        });
      }
      setFormInputs(post);
    }
  }, [post?.id, !!space]);

  return (
    <>
      <Dialog
        fullWidth
        toolbar={
          post ? (
            <Box display='flex' justifyContent='space-between'>
              <Button
                data-test='open-post-as-page'
                size='small'
                color='secondary'
                href={relativePath}
                variant='text'
                startIcon={<OpenInFullIcon fontSize='small' />}
                sx={{ px: 1.5 }}
              >
                Open as Page
              </Button>
            </Box>
          ) : (
            <div />
          )
        }
        toolsMenu={
          <Stack flexDirection='row' gap={1}>
            {!isDraftsLoading && ((!isLoading && !post) || post?.isDraft) ? (
              <Button
                data-test='view-drafted-posts'
                size='small'
                color='secondary'
                onClick={() => setIsDraftPostListOpen(true)}
                variant='text'
                startIcon={<MessageOutlinedIcon fontSize='small' />}
              >
                View {draftedPosts.length > 0 ? `${draftedPosts.length} ` : ''}drafts
              </Button>
            ) : null}
            <FullPageActionsMenuButton isInsideDialog post={post} onDelete={close} />
          </Stack>
        }
        onClose={() => {
          if (contentUpdated) {
            setShowConfirmDialog(true);
          } else {
            close();
          }
        }}
      >
        {!isLoading && spaceId && formInputs && (
          <PostPage
            formInputs={formInputs}
            setFormInputs={(_formInputs) => {
              setContentUpdated(true);
              setFormInputs((__formInputs) => ({ ...emptyPost, ...(__formInputs ?? {}), ..._formInputs }));
            }}
            isInsideDialog
            post={post ?? null}
            spaceId={spaceId}
            contentUpdated={contentUpdated}
            setContentUpdated={setContentUpdated}
            newPostCategory={newPostCategory}
          />
        )}
        <ConfirmDeleteModal
          onClose={() => {
            setShowConfirmDialog(false);
          }}
          title='Unsaved changes'
          open={showConfirmDialog}
          buttonText='Discard'
          secondaryButtonText='Go back'
          question='Are you sure you want to close this post? You have unsaved changes'
          onConfirm={close}
        />
      </Dialog>
      <MuiDialog
        fullWidth
        fullScreen={isMobile}
        open={isDraftPostListOpen}
        onClose={() => setIsDraftPostListOpen(false)}
      >
        <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={() => setIsDraftPostListOpen(false)}>
          Drafts ({draftedPosts.length})
        </DialogTitle>
        <DialogContent>
          {draftedPosts.length === 0 ? (
            <Card variant='outlined'>
              <Box p={3} textAlign='center'>
                <MessageOutlinedIcon fontSize='large' color='secondary' />
                <Typography color='secondary'>No drafted posts yet.</Typography>
              </Box>
            </Card>
          ) : (
            <DraftPostList
              onClick={showDraftPost}
              openPostId={post?.id}
              draftPosts={draftedPosts}
              deletePost={deleteDraftPost}
            />
          )}
        </DialogContent>
      </MuiDialog>
    </>
  );
}
