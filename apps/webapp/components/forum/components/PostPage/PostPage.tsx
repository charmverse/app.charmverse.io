import type { Post, PostCategory } from '@charmverse/core/prisma';
import CommentIcon from '@mui/icons-material/Comment';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { PostCommentWithVoteAndChildren } from '@packages/lib/forums/comments/interface';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { ProposalBanner } from 'components/[pageId]/DocumentPage/components/ProposalBanner';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { handleImageFileDrop } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { Comment } from 'components/common/comments/Comment';
import type { CommentSortType } from 'components/common/comments/CommentSort';
import { CommentSort } from 'components/common/comments/CommentSort';
import type { CreateCommentPayload, UpdateCommentPayload } from 'components/common/comments/interfaces';
import { getUpdatedCommentVote, processComments, sortComments } from 'components/common/comments/utils';
import ErrorPage from 'components/common/errors/ErrorPage';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import { PostCommentForm } from 'components/forum/components/PostPage/components/PostCommentForm';
import { usePostCategoryPermissions } from 'components/forum/hooks/usePostCategoryPermissions';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useMembers } from 'hooks/useMembers';
import { usePostPermissions } from 'hooks/usePostPermissions';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { fontClassName } from 'theme/fonts';

import type { FormInputs } from '../interfaces';
import { usePostDialog } from '../PostDialog/hooks/usePostDialog';

import { CategoryPosts } from './components/CategoryPosts';
import { PostCategoryInput } from './components/PostCategoryInput';
import { DraftPostBanner } from './DraftPostBanner';

type Props = {
  spaceId: string;
  post: Post | null;
  isInsideDialog?: boolean;
  setFormInputs: (params: Partial<FormInputs>) => void;
  formInputs: FormInputs;
  contentUpdated: boolean;
  setContentUpdated: (changed: boolean) => void;
  showOtherCategoryPosts?: boolean;
  newPostCategory?: PostCategory | null;
  onTitleChange?: (newTitle: string) => void;
};

export function PostPage({
  onTitleChange,
  isInsideDialog,
  post,
  spaceId,
  setFormInputs,
  formInputs,
  contentUpdated,
  setContentUpdated,
  showOtherCategoryPosts,
  newPostCategory
}: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser();
  const { categories, getForumCategoryById } = useForumCategories();
  const { showMessage } = useSnackbar();
  const { showPost } = usePostDialog();
  const { setPageProps, printRef: _printRef } = useCharmEditor();
  const [isPublishingDraftPost, setIsPublishingDraftPost] = useState(false);
  // We should only set writeable categories for new post
  const [categoryId, setCategoryId] = useState(
    (() => {
      if (post?.categoryId) {
        return post.categoryId;
      } else if (newPostCategory?.id && getForumCategoryById(newPostCategory.id)?.permissions.create_post) {
        return newPostCategory?.id;
      } else if (
        currentSpace?.defaultPostCategoryId &&
        getForumCategoryById(currentSpace?.defaultPostCategoryId)?.permissions.create_post
      ) {
        return currentSpace?.defaultPostCategoryId;
      } else {
        return categories.find((category) => category.permissions.create_post)?.id;
      }
    })()
  );

  const { permissions: categoryPermissions } = usePostCategoryPermissions(categoryId as string);

  const { getMemberById } = useMembers();
  const { navigateToSpacePath, router } = useCharmRouter();
  const {
    data: postComments = [],
    mutate: setPostComments,
    isValidating
  } = useSWR(post ? `${post.id}/comments` : null, () =>
    post && !post.isDraft ? charmClient.forum.listPostComments(post.id) : undefined
  );

  const permissions = usePostPermissions({ postIdOrPath: post?.id as string, isNewPost: !post });

  usePreventReload(contentUpdated);
  const [commentSort, setCommentSort] = useState<CommentSortType>('latest');

  const isLoading = !postComments && isValidating;
  const isPublishedPost = post && !post.isDraft;

  const postCategory = getForumCategoryById(categoryId);
  const createdBy = getMemberById(post?.createdBy);

  function updateTitle(updates: { title: string; updatedAt: any }) {
    setContentUpdated(true);
    setFormInputs({ title: updates.title });
    onTitleChange?.(updates.title);
  }

  useEffect(() => {
    if (post && onTitleChange) {
      onTitleChange(post.title);
    }
  }, [post]);

  // keep a ref in sync for printing
  const printRef = useRef(null);
  useEffect(() => {
    if (printRef?.current !== _printRef?.current) {
      setPageProps({
        printRef
      });
    }
  }, [printRef, _printRef]);

  async function createForumPost(isDraft: boolean) {
    if (checkIsContentEmpty(formInputs.content) || !categoryId) {
      throw new Error('Missing required fields to save forum post');
    }
    if (post) {
      await charmClient.forum.updateForumPost(post.id, {
        categoryId,
        content: formInputs.content,
        contentText: formInputs.contentText,
        title: formInputs.title
      });
      setContentUpdated(false);
    } else {
      const newPost = await charmClient.forum
        .createForumPost({
          categoryId,
          content: formInputs.content,
          contentText: formInputs.contentText ?? '',
          spaceId,
          title: formInputs.title,
          isDraft
        })
        .catch((err) => {
          showMessage(err.message ?? 'Something went wrong', 'error');
          throw err;
        });
      if (!isDraft) {
        navigateToSpacePath(`/forum/post/${newPost.path}`);
      } else {
        showPost({
          postId: newPost.id,
          onClose() {
            setUrlWithoutRerender(router.pathname, { postId: null });
          }
        });
        setUrlWithoutRerender(router.pathname, { postId: newPost.id });
      }
    }
  }

  async function publishDraftPost(draftPost: Post) {
    if (!isPublishingDraftPost) {
      setIsPublishingDraftPost(true);
      // pass in latest content as well
      await charmClient.forum.updateForumPost(draftPost.id, {
        categoryId,
        content: formInputs.content,
        contentText: formInputs.contentText,
        title: formInputs.title,
        isDraft: false
      });
      setIsPublishingDraftPost(false);
      navigateToSpacePath(`/forum/post/${draftPost.path}`);
    }
  }

  function updateCategoryId(_categoryId: string) {
    setContentUpdated(true);
    setCategoryId(_categoryId);
  }

  function updatePostContent({ doc, rawText }: ICharmEditorOutput) {
    setContentUpdated(true);
    setFormInputs({
      content: doc,
      contentText: rawText
    });
  }
  let disabledTooltip = '';
  if (!formInputs.title) {
    disabledTooltip = 'Title is required';
  } else if (checkIsContentEmpty(formInputs.content)) {
    disabledTooltip = 'Content is required';
  } else if (!categoryId) {
    disabledTooltip = 'Category is required';
  } else if (isPublishingDraftPost) {
    disabledTooltip = 'Publishing draft post';
  } else if (!post && categoryPermissions?.create_post === false) {
    disabledTooltip = 'You do not have permission to create posts in this category';
  }

  const topLevelComments: PostCommentWithVoteAndChildren[] = useMemo(() => {
    if (postComments && post) {
      return sortComments({
        comments: processComments({ comments: postComments, sort: commentSort }),
        sort: commentSort
      }) as PostCommentWithVoteAndChildren[];
    }
    return [];
  }, [postComments, post, commentSort]);

  const canEdit = !!permissions?.edit_post;

  async function updateComment({ id, content, contentText }: UpdateCommentPayload) {
    const comment = postComments.find((_comment) => _comment.id === id);
    if (comment) {
      const updatedComment = await charmClient.forum.updatePostComment({
        commentId: id,
        content,
        contentText,
        postId: comment.postId
      });

      setPostComments((comments) =>
        comments?.map((_comment) => (_comment.id === comment.id ? { ..._comment, ...updatedComment } : _comment))
      );
    }
  }

  async function voteComment({ upvoted, commentId }: { upvoted: boolean | null; commentId: string }) {
    const comment = postComments.find((_comment) => _comment.id === commentId);
    if (comment) {
      await charmClient.forum.upOrDownVoteComment({
        postId: comment.postId,
        commentId,
        upvoted
      });

      const postCommentVote = getUpdatedCommentVote(comment, upvoted);

      setPostComments((comments) =>
        comments?.map((_comment) =>
          _comment.id === comment.id
            ? {
                ...comment,
                ...postCommentVote
              }
            : _comment
        )
      );
    }
  }

  async function addComment({ content, contentText, parentId }: CreateCommentPayload) {
    const parentComment = postComments.find((_comment) => _comment.id === parentId);
    if (parentComment) {
      const postComment = await charmClient.forum.createPostComment(parentComment.postId, {
        content,
        contentText,
        parentId
      });
      setPostComments((comments) => (comments ? [postComment, ...comments] : []));
    }
  }

  async function deleteComment(commentId: string) {
    const parentComment = postComments.find((_comment) => _comment.id === commentId);
    if (parentComment) {
      await charmClient.forum.deletePostComment({ commentId, postId: parentComment.postId });
      setPostComments((comments) =>
        comments?.map((_comment) =>
          _comment.id === parentComment.id ? { ..._comment, deletedAt: new Date() } : _comment
        )
      );
    }
  }

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core[data-post-id="${post?.id}"]`)?.dispatchEvent(focusEvent);
  }

  useEffect(() => {
    const commentId = router.query.commentId;
    if (commentId && typeof window !== 'undefined' && !isValidating && postComments.length) {
      setTimeout(() => {
        const commentDomElement = window.document.getElementById(`comment-${commentId}`);
        if (commentDomElement) {
          requestAnimationFrame(() => {
            commentDomElement.scrollIntoView({
              behavior: 'smooth'
            });
            setUrlWithoutRerender(router.pathname, { commentId: null });
          });
        }
      }, 250);
    }
  }, [router.query.commentId, isValidating]);

  if (!permissions) {
    return <LoadingComponent />;
  } else if (!permissions.view_post) {
    return <ErrorPage message='Post not found' />;
  }

  return (
    <>
      {post?.proposalId && <ProposalBanner type='post' proposalId={post.proposalId} />}
      {post?.isDraft && <DraftPostBanner />}
      <div
        ref={printRef}
        className={`document-print-container ${fontClassName}`}
        style={{
          overflowY: 'auto'
        }}
        id={`post-charmeditor-${post?.id}`}
      >
        <Stack
          flexDirection='row'
          onDrop={handleImageFileDrop({
            parentElementId: `post-charmeditor-${post?.id}`,
            readOnly: !canEdit,
            postId: post?.id
          })}
        >
          <PageEditorContainer top={50}>
            <Box minHeight={300} data-test='post-charmeditor'>
              {isPublishedPost && isInsideDialog && (
                <Chip
                  label={postCategory?.name}
                  sx={{
                    cursor: 'pointer',
                    opacity: postCategory ? 1 : 0
                  }}
                  size='small'
                  component={Link}
                  href={`/forum/${postCategory?.path}`}
                />
              )}
              <PageTitleInput
                readOnly={!canEdit}
                value={formInputs.title}
                onChange={updateTitle}
                focusDocumentEditor={focusDocumentEditor}
              />
              {createdBy && (
                <UserDisplay showMiniProfile userId={createdBy.id} avatarSize='small' fontSize='medium' mt={2} mb={3} />
              )}
              <Box my={2}>
                {canEdit && <PostCategoryInput setCategoryId={updateCategoryId} categoryId={categoryId} />}
              </Box>
              <CharmEditor
                allowClickingFooter={true}
                pageType='post'
                autoFocus={false}
                readOnly={!canEdit}
                postId={post?.id}
                disablePageSpecificFeatures
                enableVoting={true}
                isContentControlled
                key={`${user?.id}.${post?.proposalId}.${canEdit}`}
                content={formInputs.content as PageContent}
                onContentChange={updatePostContent}
              />
            </Box>
            {canEdit && (
              <Stack flexDirection='row' gap={1} justifyContent='flex-end' my={2}>
                {(!post || post.isDraft) && (
                  <Button
                    disabled={Boolean(disabledTooltip) || !contentUpdated}
                    disabledTooltip={disabledTooltip}
                    onClick={() => createForumPost(true)}
                    color='secondary'
                    variant='outlined'
                  >
                    {post ? 'Update draft' : 'Save draft'}
                  </Button>
                )}
                {post?.isDraft && (
                  <Button
                    disabled={
                      Boolean(disabledTooltip) || isPublishingDraftPost || categoryPermissions?.create_post === false
                    }
                    disabledTooltip={disabledTooltip}
                    onClick={() => publishDraftPost(post)}
                    loading={isPublishingDraftPost}
                  >
                    Post
                  </Button>
                )}
                {!post?.isDraft && (
                  <Button
                    disabled={
                      Boolean(disabledTooltip) ||
                      !contentUpdated ||
                      (!post && categoryPermissions?.create_post === false)
                    }
                    disabledTooltip={disabledTooltip}
                    onClick={() => createForumPost(false)}
                  >
                    {post ? 'Update' : 'Post'}
                  </Button>
                )}
              </Stack>
            )}
            {post && !post.isDraft && (
              <>
                <Box my={2} data-test='new-top-level-post-comment'>
                  <PostCommentForm
                    disabled={!permissions.add_comment}
                    placeholder={
                      !permissions.add_comment
                        ? 'You do not have permission to comment on posts in this category'
                        : undefined
                    }
                    setPostComments={setPostComments}
                    postId={post.id}
                  />
                </Box>

                <Divider
                  sx={{
                    my: 2
                  }}
                />

                {isLoading ? (
                  <Box height={100}>
                    <LoadingComponent size={24} isLoading label='Fetching comments' />
                  </Box>
                ) : (
                  post && (
                    <>
                      {topLevelComments.length > 0 && (
                        <Stack gap={1}>
                          <CommentSort commentSort={commentSort} setCommentSort={setCommentSort} />
                          {topLevelComments.map((comment) => (
                            <Comment
                              permissions={permissions}
                              comment={comment}
                              key={comment.id}
                              handleCreateComment={addComment}
                              handleUpdateComment={updateComment}
                              handleDeleteComment={deleteComment}
                              handleVoteComment={voteComment}
                              deletingDisabled={!!post?.proposalId}
                            />
                          ))}
                        </Stack>
                      )}
                      {topLevelComments.length === 0 && (
                        <Stack gap={1} alignItems='center' my={1}>
                          <CommentIcon color='secondary' fontSize='large' />
                          <Typography color='secondary' variant='h6'>
                            No Comments Yet
                          </Typography>
                          {permissions?.add_comment && (
                            <Typography color='secondary'>Be the first to share what you think!</Typography>
                          )}
                        </Stack>
                      )}
                    </>
                  )
                )}
              </>
            )}
          </PageEditorContainer>
          {post && showOtherCategoryPosts && (
            <Box
              width='25%'
              mr={8}
              display={{
                xs: 'none',
                md: 'initial'
              }}
            >
              <CategoryPosts postId={post.id} categoryId={post.categoryId} />
            </Box>
          )}
        </Stack>
      </div>
    </>
  );
}
