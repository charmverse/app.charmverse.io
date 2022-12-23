import { Box, Divider, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { useUser } from 'hooks/useUser';
import type { PostCommentWithVoteAndChildren } from 'lib/forums/comments/interface';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { PostCategoryInput } from './components/PostCategoryInput';
import { PostComment } from './components/PostComment';
import { PostCommentForm } from './components/PostCommentForm';

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

export function PostPage({ page, spaceId, onSave }: Props) {
  const { user } = useUser();
  const [form, setForm] = useState<FormInputs>(page ?? { title: '', content: null, contentText: '' });
  const [categoryId, setCategoryId] = useState(page?.post.categoryId ?? null);
  const { data: postComments = [], mutate: setPostComments } = useSWR(page ? `${page.id}/comments` : null, () =>
    page ? charmClient.forum.listPostComments(page.id) : []
  );

  function updateTitle(updates: { title: string; updatedAt: any }) {
    setForm((_form) => ({ ..._form, title: updates.title }));
  }

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
    const postCommentsRecord: Record<string, PostCommentWithVoteAndChildren> = {};
    postComments.forEach((postComment) => {
      postCommentsRecord[postComment.id] = {
        ...postComment,
        children: []
      };
    });
    postComments.forEach((postComment) => {
      if (postComment.parentId !== page?.id) {
        postCommentsRecord[postComment.parentId].children.push(postCommentsRecord[postComment.id]);
      }
    });
    const _topLevelComments: PostCommentWithVoteAndChildren[] = [];
    Object.values(postCommentsRecord).forEach((comment) => {
      comment.children = comment.children.sort((c1, c2) => (c1.createdAt < c2.createdAt ? -1 : 1));
      if (comment.parentId === page?.id) {
        _topLevelComments.push(comment);
      }
    });
    return _topLevelComments;
  }, [postComments, page]);

  return (
    <Container top={50}>
      <Box minHeight={300}>
        <CharmEditor
          readOnly={readOnly}
          pageActionDisplay={null}
          pageId={page?.id}
          disablePageSpecificFeatures={true}
          pageType='post'
          isContentControlled={true}
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

      {page?.post && <PostCommentForm setPostComments={setPostComments} postId={page.post.id} />}
      <Divider
        sx={{
          my: 2
        }}
      />
      <Stack gap={1}>
        {topLevelComments.map((comment) => (
          <PostComment setPostComments={setPostComments} comment={comment} key={comment.id} />
        ))}
      </Stack>
    </Container>
  );
}
