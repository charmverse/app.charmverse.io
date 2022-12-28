import CommentIcon from '@mui/icons-material/Comment';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import LoadingComponent from 'components/common/LoadingComponent';
import { ScrollableWindow } from 'components/common/PageLayout';
import { usePageTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import type { PostCommentWithVote, PostCommentWithVoteAndChildren } from 'lib/forums/comments/interface';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { PostCategoryInput } from './components/PostCategoryInput';
import { PostComment } from './components/PostComment';
import { PostCommentForm } from './components/PostCommentForm';
import { PostCommentSort } from './components/PostCommentSort';

type Props = {
  spaceId: string;
  page: ForumPostPage | null;
  onSave?: () => void;
};

type FormInputs = {
  title: string;
  content: any | null;
  contentText?: string;
  id?: string;
};

function processComments({ postComments, rootPageId }: { postComments: PostCommentWithVote[]; rootPageId: string }) {
  const topLevelComments: PostCommentWithVoteAndChildren[] = [];

  const postCommentsRecord: Record<string, PostCommentWithVoteAndChildren> = {};
  postComments.forEach((postComment) => {
    postCommentsRecord[postComment.id] = {
      ...postComment,
      children: []
    };
  });
  postComments.forEach((postComment) => {
    if (postComment.parentId !== rootPageId) {
      postCommentsRecord[postComment.parentId].children.push(postCommentsRecord[postComment.id]);
    }
  });
  Object.values(postCommentsRecord).forEach((comment) => {
    comment.children = comment.children.sort((c1, c2) => (c1.createdAt < c2.createdAt ? 1 : -1));
    if (comment.parentId === rootPageId) {
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

export function PostPage({ page, spaceId, onSave }: Props) {
  const { user } = useUser();
  const [form, setForm] = useState<FormInputs>(page ?? { title: '', content: null, contentText: '' });
  const [categoryId, setCategoryId] = useState(page?.post.categoryId ?? null);
  const {
    data: postComments,
    mutate: setPostComments,
    isValidating
  } = useSWR(page ? `${page.id}/comments` : null, () =>
    page ? charmClient.forum.listPostComments(page.id) : undefined
  );
  const [, setTitleState] = usePageTitle();

  const [commentSort, setCommentSort] = useState<PostCommentSort>('latest');

  const isLoading = !postComments && isValidating;

  function updateTitle(updates: { title: string; updatedAt: any }) {
    setForm((_form) => ({ ..._form, title: updates.title }));
    setTitleState(updates.title);
  }

  useEffect(() => {
    if (page) {
      setTitleState(page.title);
    }
  }, [page]);

  async function publishForumPost() {
    if (checkIsContentEmpty(form.content) || !categoryId) {
      throw new Error('Missing required fields to save forum post');
    }
    if (page) {
      await charmClient.forum.updateForumPost(page.id, {
        categoryId,
        content: form.content,
        contentText: form.contentText,
        title: form.title
      });
    } else {
      await charmClient.forum.createForumPost({
        categoryId,
        content: form.content,
        contentText: form.contentText ?? '',
        spaceId,
        title: form.title
      });
    }
    onSave?.();
  }

  function updateCategoryId(_categoryId: string) {
    setCategoryId(_categoryId);
  }

  function updatePostContent({ doc, rawText }: ICharmEditorOutput) {
    setForm((_form) => ({
      ..._form,
      content: doc,
      contentText: rawText
    }));
  }
  const isMyPost = !page || page.createdBy === user?.id;
  const readOnly = !isMyPost;

  let disabledTooltip = '';
  if (!form.title) {
    disabledTooltip = 'Title is required';
  } else if (checkIsContentEmpty(form.content)) {
    disabledTooltip = 'Content is required';
  } else if (!categoryId) {
    disabledTooltip = 'Category is required';
  }

  const topLevelComments = useMemo(() => {
    if (postComments && page) {
      return sortComments({
        comments: processComments({
          postComments,
          rootPageId: page.id
        }),
        sort: commentSort
      });
    }
    return [];
  }, [postComments, page, commentSort]);

  return (
    <ScrollableWindow>
      <Container
        top={50}
        style={{
          marginLeft: 75
        }}
      >
        <Box minHeight={300}>
          <CharmEditor
            readOnly={readOnly}
            pageActionDisplay={null}
            pageId={page?.id}
            disablePageSpecificFeatures
            pageType='post'
            isContentControlled
            key={user?.id}
            content={form.content as PageContent}
            onContentChange={updatePostContent}
          >
            <PageTitleInput readOnly={readOnly} value={form.title} onChange={updateTitle} />
            <Box my={2}>
              <PostCategoryInput spaceId={spaceId} setCategoryId={updateCategoryId} categoryId={categoryId} />
            </Box>
          </CharmEditor>
        </Box>
        {isMyPost && (
          <Box display='flex' flexDirection='row' justifyContent='right' my={2}>
            <Button disabled={Boolean(disabledTooltip)} disabledTooltip={disabledTooltip} onClick={publishForumPost}>
              {page ? 'Update' : 'Post'}
            </Button>
          </Box>
        )}

        {page?.post && (
          <Box my={2}>
            <PostCommentForm setPostComments={setPostComments} postId={page.post.id} />
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
          page?.post && (
            <>
              <Stack gap={1}>
                <PostCommentSort commentSort={commentSort} setCommentSort={setCommentSort} />
                {topLevelComments.map((comment) => (
                  <PostComment setPostComments={setPostComments} comment={comment} key={comment.id} />
                ))}
              </Stack>
              {topLevelComments.length === 0 && (
                <Stack gap={1} alignItems='center' my={1}>
                  <CommentIcon color='secondary' fontSize='large' />
                  <Typography color='secondary' variant='h6'>
                    No Comments Yet
                  </Typography>
                  <Typography color='secondary'>Be the first to share what you think!</Typography>
                </Stack>
              )}
            </>
          )
        )}
      </Container>
    </ScrollableWindow>
  );
}
