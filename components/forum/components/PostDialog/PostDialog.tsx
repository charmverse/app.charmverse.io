import type { Post, PostCategory } from '@charmverse/core/prisma';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Card, DialogContent, Stack, Typography } from '@mui/material';
import MuiDialog from '@mui/material/Dialog';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import { DialogTitle } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { PageActions } from 'components/common/PageActions/PageActions';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { usePostPermissions } from 'hooks/usePostPermissions';
import { useUser } from 'hooks/useUser';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import type { FormInputs } from '../interfaces';
import { DraftPostList } from '../PostList/DraftPostList';
import { PostPage } from '../PostPage/PostPage';

import { usePostDialog } from './hooks/usePostDialog';

interface Props {
  post?: PostWithVotes | null;
  isLoading: boolean;
  spaceId: string;
  onClose: () => void;
  newPostCategory?: PostCategory | null;
}

export function PostDialog({ post, isLoading, spaceId, onClose, newPostCategory }: Props) {
  const mounted = useRef(false);
  const router = useRouter();
  const [formInputs, setFormInputs] = useState<FormInputs>(post ?? { title: '', content: null, contentText: '' });
  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user } = useUser();
  const {
    data: draftedPosts = [],
    isLoading: isDraftsLoading,
    mutate: mutateDraftPosts
  } = useSWR(user ? `/users/${user.id}/drafted-posts` : null, () => charmClient.forum.listDraftPosts({ spaceId }));

  const { showPost, createPost } = usePostDialog();
  const isMobile = useSmallScreen();

  const [isDraftPostListOpen, setIsDraftPostListOpen] = useState(false);

  const permissions = usePostPermissions({
    postIdOrPath: post?.id as string,
    isNewPost: !post
  });

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function close() {
    onClose();
    setFormInputs({ title: '', content: null, contentText: '' });
    setContentUpdated(false);
    setShowConfirmDialog(false);
    setIsDraftPostListOpen(false);
  }

  function deletePost() {
    if (post) {
      charmClient.forum.deleteForumPost(post.id).then(() => {
        mutateDraftPosts(
          (_posts) => {
            if (_posts) {
              return _posts.filter((_post) => _post.id !== post.id);
            }
            return [];
          },
          { revalidate: false }
        );
        close();
      });
    }
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
      if (post?.id === postId) {
        createPost({ spaceId, category: newPostCategory || null });
      }
    });
  }

  const relativePath = `/${router.query.domain}/forum/post/${post?.path}`;

  return (
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
          {post && (
            <PageActions
              page={{ ...post, relativePath }}
              onClickDelete={permissions?.delete_post ? deletePost : undefined}
              hideDuplicateAction
            />
          )}
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
      {!isLoading && (
        <PostPage
          formInputs={formInputs}
          setFormInputs={(_formInputs) => {
            setContentUpdated(true);
            setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
          }}
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
    </Dialog>
  );
}
