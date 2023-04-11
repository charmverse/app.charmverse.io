import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Stack } from '@mui/material';
import type { Post, PostCategory } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { PageActions } from 'components/common/PageActions';
import { usePostPermissions } from 'components/forum/hooks/usePostPermissions';
import { useUser } from 'hooks/useUser';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import type { FormInputs } from '../interfaces';
import { DraftPostList } from '../PostList/DraftPostList';
import { PostPage } from '../PostPage/PostPage';

import { usePostDialog } from './hooks/usePostDialog';

interface Props {
  post?: PostWithVotes | null;
  spaceId: string;
  onClose: () => void;
  open?: boolean;
  newPostCategory?: PostCategory | null;
}

export function PostDialog({ post, spaceId, onClose, open, newPostCategory }: Props) {
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'post-dialog' });
  const router = useRouter();
  const [formInputs, setFormInputs] = useState<FormInputs>(post ?? { title: '', content: null, contentText: '' });
  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user } = useUser();
  const {
    data: draftedPosts = [],
    isLoading,
    mutate: mutateDraftPosts
  } = useSWR(user ? `/users/${user.id}/drafted-posts` : null, () => charmClient.forum.listDraftPosts({ spaceId }));

  const { showPost } = usePostDialog();

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
    setFormInputs({ title: '', content: null, contentText: '' });
    setContentUpdated(false);
    setShowConfirmDialog(false);
    setIsDraftPostListOpen(false);
    showPost({
      postId: null
    });
  }

  function deletePost() {
    if (post) {
      charmClient.forum.deleteForumPost(post.id).then(() => {
        close();
      });
    }
  }

  function showDraftPost(draftPost: Post) {
    setIsDraftPostListOpen(false);
    popupState.close();
    onClose();
    showPost({
      postId: draftPost.id,
      onClose() {
        setUrlWithoutRerender(router.pathname, { postId: null });
      }
    });
    setUrlWithoutRerender(router.pathname, { postId: draftPost.id });
  }

  if (!popupState.isOpen) {
    return null;
  }

  const relativePath = `/${router.query.domain}/forum/post/${post?.path}`;

  return (
    <Dialog
      fullWidth
      toolbar={
        <Stack flexDirection='row' gap={1}>
          {post ? (
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
          )}
          {!isLoading && draftedPosts.length && !post ? (
            <Box display='flex' justifyContent='space-between'>
              <Button
                data-test='view-drafted-posts'
                size='small'
                color='secondary'
                onClick={() => setIsDraftPostListOpen(true)}
                variant='text'
                startIcon={<ArticleOutlinedIcon fontSize='small' />}
              >
                View {draftedPosts.length} draft{draftedPosts.length > 1 ? 's' : ''}
              </Button>
            </Box>
          ) : null}
        </Stack>
      }
      toolsMenu={
        post && (
          <PageActions
            page={{ ...post, relativePath }}
            onClickDelete={permissions?.delete_post ? deletePost : undefined}
            hideDuplicateAction
          />
        )
      }
      onClose={() => {
        if (contentUpdated) {
          setShowConfirmDialog(true);
        } else {
          close();
        }
      }}
    >
      <PostPage
        formInputs={formInputs}
        setFormInputs={(_formInputs) => {
          setContentUpdated(true);
          setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
        }}
        post={post ?? null}
        spaceId={spaceId}
        onSave={close}
        contentUpdated={contentUpdated}
        setContentUpdated={setContentUpdated}
        newPostCategory={newPostCategory}
      />
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
      <Modal open={isDraftPostListOpen} onClose={() => setIsDraftPostListOpen(false)}>
        <DraftPostList
          onClose={() => setIsDraftPostListOpen(false)}
          onClick={showDraftPost}
          draftPosts={draftedPosts}
          mutateDraftPosts={mutateDraftPosts}
        />
      </Modal>
    </Dialog>
  );
}
