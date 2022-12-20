import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
import { useState } from 'react';

import charmClient from 'charmClient';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { useUser } from 'hooks/useUser';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import type { PageContent } from 'models/Page';

import { PostCategoryInput } from './components/PostCategoryInput';

type Props = {
  spaceId: string;
  page: ForumPostPage | null;
  onSave?: () => void;
};

type FormInputs = {
  title: string;
  content: any | null;
  contentText: string;
  id?: string;
};

export function PostPage(props: Props) {
  const { user } = useUser();
  const [form, setForm] = useState<FormInputs>(props.page ?? { title: '', content: null, contentText: '' });
  const [categoryId, setCategoryId] = useState(props.page?.post.categoryId ?? null);

  function updateTitle(updates: { title: string; updatedAt: any }) {
    setForm((_form) => ({ ..._form, title: updates.title }));
  }

  async function publishForumPost() {
    if (!form.content || !form.contentText || !categoryId) {
      throw new Error('Missing required fields to save forum post');
    }
    if (props.page) {
      await charmClient.forum.updateForumPost(props.page.id, {
        categoryId,
        content: form.content,
        contentText: form.contentText,
        title: form.title
      });
    } else {
      await charmClient.forum.createForumPost({
        categoryId,
        content: form.content,
        contentText: form.contentText,
        spaceId: props.spaceId,
        title: form.title
      });
    }
    props.onSave?.();
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
  const isMyPost = !props.page || props.page.createdBy === user?.id;
  const readOnly = !isMyPost;
  let disabledTooltip = '';
  if (!form.title) {
    disabledTooltip = 'Title is required';
  } else if (!form.contentText) {
    disabledTooltip = 'Content is required';
  } else if (!categoryId) {
    disabledTooltip = 'Category is required';
  }

  return (
    <Container top={50}>
      <Box minHeight={300}>
        <CharmEditor
          readOnly={readOnly}
          pageActionDisplay={null}
          pageId={props.page?.id}
          disablePageSpecificFeatures={true}
          pageType='post'
          isContentControlled={true}
          content={form.content as PageContent}
          onContentChange={updatePostContent}
        >
          <PageTitleInput readOnly={readOnly} value={form.title} onChange={updateTitle} />
          <Box my={2}>
            <PostCategoryInput spaceId={props.spaceId} setCategoryId={updateCategoryId} categoryId={categoryId} />
          </Box>
        </CharmEditor>
      </Box>
      {isMyPost && (
        <Box display='flex' flexDirection='row' justifyContent='right' my={2}>
          <Button disabled={Boolean(disabledTooltip)} disabledTooltip={disabledTooltip} onClick={publishForumPost}>
            {props.page ? 'Update' : 'Post'}
          </Button>
        </Box>
      )}
    </Container>
  );
}
