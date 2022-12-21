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
import log from 'lib/log';
import type { PageUpdates } from 'lib/pages';
import debouncePromise from 'lib/utilities/debouncePromise';
import type { PageContent } from 'models/Page';

import { PostCategoryInput } from './components/PostCategoryInput';
import { PostComment } from './components/PostComment';

interface Props {
  page: ForumPostPage;
  onPublish?: () => void;
}

export function PostPage(props: Props) {
  const { page } = props;
  const { user } = useUser();
  const [title, setTitle] = useState(props.page.title);

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    if (page) {
      await charmClient.forum.updateForumPost(page.id, updates);
    }
  }, 500);

  function updateTitle(updates: { title: string; updatedAt: any }) {
    debouncedPageUpdate({ id: page.id, ...updates } as Partial<Page>).catch((err: any) => {
      log.error('Error saving page', err);
    });
    setTitle(updates.title);
  }

  async function publishForumPost() {
    await charmClient.forum.publishForumPost(page.post.id);
    props.onPublish?.();
  }

  async function updateCategoryId(categoryId: string) {
    await charmClient.forum.updateForumPost(page.id, {
      categoryId
    });
    // mutate((_page) => (_page ? { ..._page, post: { ..._page?.post, categoryId } } : undefined), {
    //   revalidate: false
    // });
  }

  function updatePostContent({ doc, rawText }: ICharmEditorOutput) {
    charmClient.forum.updateForumPost(page.id, {
      content: doc,
      contentText: rawText
    });
  }
  const isMyPost = page.createdBy === user?.id;
  const readOnly = !isMyPost;

  return (
    <Container top={50}>
      <Box minHeight={300}>
        <CharmEditor
          readOnly={readOnly}
          pageActionDisplay={null}
          pageId={page.id}
          disablePageSpecificFeatures={true}
          pageType={page.type}
          isContentControlled={true}
          content={page.content as PageContent}
          onContentChange={updatePostContent}
        >
          <PageTitleInput
            readOnly={readOnly}
            value={page.title}
            onChange={updateTitle}
            updatedAt={page.updatedAt.toString()}
          />
          <Box my={2}>
            <PostCategoryInput
              spaceId={page.spaceId}
              setCategoryId={updateCategoryId}
              categoryId={page.post.categoryId}
            />
          </Box>
        </CharmEditor>
      </Box>
      {isMyPost && (
        <Box display='flex' flexDirection='row' justifyContent='right' my={2}>
          <Button
            disabledTooltip={!title ? 'Post needs a title' : 'Post has already been published'}
            onClick={publishForumPost}
            disabled={page.post.status === 'published' || !title}
          >
            {page.post.status === 'published' ? 'Published' : 'Publish Post'}
          </Button>
        </Box>
      )}

      {page.postId && <PostComment postId={page.postId} />}
    </Container>
  );
}
