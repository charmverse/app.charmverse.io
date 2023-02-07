import CommentIcon from '@mui/icons-material/Comment';
import { Box, Divider, Stack, Typography } from '@mui/material';
import type { PostCategory } from '@prisma/client';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { ScrollableWindow } from 'components/common/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { usePostPermissions } from 'components/forum/hooks/usePostPermissions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useMembers } from 'hooks/useMembers';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { useUser } from 'hooks/useUser';
import type { PostCommentWithVote, PostCommentWithVoteAndChildren } from 'lib/forums/comments/interface';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { FormInputs } from '../interfaces';

import { CategoryPosts } from './components/CategoryPosts';
import { PostCategoryInput } from './components/PostCategoryInput';
import { PostComment } from './components/PostComment';
import { PostCommentForm } from './components/PostCommentForm';
import { PostCommentSort } from './components/PostCommentSort';

type Props = {
  spaceId: string;
  post: PostWithVotes | null;
  onSave?: () => void;
  setFormInputs: (params: Partial<FormInputs>) => void;
  formInputs: FormInputs;
  contentUpdated: boolean;
  setContentUpdated: (changed: boolean) => void;
  shouldUpdateTitleState?: boolean;
  showOtherCategoryPosts?: boolean;
  newPostCategory?: PostCategory | null;
};

function processComments({ postComments }: { postComments: PostCommentWithVote[] }) {
  // Get top level comments
  const topLevelComments: PostCommentWithVoteAndChildren[] = [];

  // Create the map
  const postCommentsRecord: Record<string, PostCommentWithVoteAndChildren> = {};
  postComments.forEach((postComment) => {
    postCommentsRecord[postComment.id] = {
      ...postComment,
      children: []
    };
  });

  // Push child-level comments into their parents
  postComments.forEach((postComment) => {
    if (postComment.parentId) {
      postCommentsRecord[postComment.parentId].children.push(postCommentsRecord[postComment.id]);
    }
  });
  Object.values(postCommentsRecord).forEach((comment) => {
    comment.children = comment.children.sort((c1, c2) => (c1.createdAt < c2.createdAt ? 1 : -1));
    if (!comment.parentId) {
      topLevelComments.push(comment);
    }
  });

  return topLevelComments;
}

function sortComments({ comments, sort }: { comments: PostCommentWithVoteAndChildren[]; sort: PostCommentSort }) {
  if (sort === 'latest') {
    return comments.sort((c1, c2) => (c1.createdAt > c2.createdAt ? -1 : 1));
  } else if (sort === 'top') {
    return comments.sort((c1, c2) => (c1.upvotes - c1.downvotes > c2.upvotes - c2.downvotes ? -1 : 1));
  }
  return comments;
}
export function PostPage({
  shouldUpdateTitleState = false,
  post,
  spaceId,
  onSave,
  setFormInputs,
  formInputs,
  contentUpdated,
  setContentUpdated,
  showOtherCategoryPosts,
  newPostCategory
}: Props) {
  const currentSpace = useCurrentSpace();
  const { user } = useUser();
  const { categories, getForumCategoryById } = useForumCategories();

  // We should only set writeable categories for new postd
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
  const { members } = useMembers();
  const router = useRouter();
  const {
    data: postComments,
    mutate: setPostComments,
    isValidating
  } = useSWR(post ? `${post.id}/comments` : null, () =>
    post ? charmClient.forum.listPostComments(post.id) : undefined
  );

  const { permissions } = usePostPermissions(post?.id as string, !post);

  usePreventReload(contentUpdated);
  const [, setTitleState] = usePageTitle();
  const [commentSort, setCommentSort] = useState<PostCommentSort>('latest');
  const isLoading = !postComments && isValidating;

  const createdBy = members.find((_member) => _member.id === post?.createdBy);

  function updateTitle(updates: { title: string; updatedAt: any }) {
    setContentUpdated(true);
    setFormInputs({ title: updates.title });
    if (shouldUpdateTitleState) {
      setTitleState(updates.title);
    }
  }

  useEffect(() => {
    if (post) {
      setTitleState(post.title);
    }
  }, [post]);

  async function publishForumPost() {
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
      onSave?.();
    } else {
      const newPost = await charmClient.forum.createForumPost({
        categoryId,
        content: formInputs.content,
        contentText: formInputs.contentText ?? '',
        spaceId,
        title: formInputs.title
      });
      router.push(`/${router.query.domain}/forum/post/${newPost.path}`);
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
  }

  const topLevelComments = useMemo(() => {
    if (postComments && post) {
      return sortComments({
        comments: processComments({
          postComments
        }),
        sort: commentSort
      });
    }
    return [];
  }, [postComments, post, commentSort]);

  const canEdit = !!permissions?.edit_post;

  if (!permissions) {
    return <LoadingComponent />;
  } else if (!permissions.view_post) {
    return <ErrorPage message='Post not found' />;
  }

  return (
    <ScrollableWindow>
      <Stack flexDirection='row'>
        <Container top={50}>
          <Box minHeight={300} data-test='post-charmeditor'>
            <CharmEditor
              pageType='post'
              autoFocus={false}
              readOnly={!canEdit}
              pageActionDisplay={null}
              pageId={post?.id}
              disablePageSpecificFeatures
              enableVoting={false}
              isContentControlled
              key={user?.id}
              content={formInputs.content as PageContent}
              onContentChange={updatePostContent}
            >
              <PageTitleInput readOnly={!canEdit} value={formInputs.title} onChange={updateTitle} />
              {createdBy && (
                <UserDisplay showMiniProfile user={createdBy} avatarSize='small' fontSize='medium' mt={2} mb={3} />
              )}
              <Box my={2}>
                <PostCategoryInput readOnly={!canEdit} setCategoryId={updateCategoryId} categoryId={categoryId} />
              </Box>
            </CharmEditor>
          </Box>
          {canEdit && (
            <Box display='flex' flexDirection='row' justifyContent='right' my={2}>
              <Button
                disabled={Boolean(disabledTooltip) || !contentUpdated}
                disabledTooltip={disabledTooltip}
                onClick={publishForumPost}
              >
                {post ? 'Update' : 'Post'}
              </Button>
            </Box>
          )}
          {post && !!permissions?.add_comment && (
            <Box my={2} data-test='new-top-level-post-comment'>
              <PostCommentForm setPostComments={setPostComments} postId={post.id} />
            </Box>
          )}
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
                    <PostCommentSort commentSort={commentSort} setCommentSort={setCommentSort} />
                    {topLevelComments.map((comment) => (
                      <PostComment
                        permissions={permissions}
                        setPostComments={setPostComments}
                        comment={comment}
                        key={comment.id}
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
        </Container>
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
    </ScrollableWindow>
  );
}
