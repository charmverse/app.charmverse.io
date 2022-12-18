import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
import { useCallback, useRef } from 'react';

import charmClient from 'charmClient';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import CharmEditor from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { useUser } from 'hooks/useUser';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import log from 'lib/log';
import type { PageUpdates } from 'lib/pages';
import debouncePromise from 'lib/utilities/debouncePromise';
import type { PageContent } from 'models/Page';

import { PostCategoryInput } from './components/PostCategoryInput';
import { PublishPostButton } from './components/PublishPostButton';

interface Props {
  page: ForumPostPage;
}

export function PostPage(props: Props) {
  const { page } = props;
  const mounted = useRef(false);
  const { user } = useUser();

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    if (page) {
      await charmClient.forum.updateForumPost(page.id, updates);
    }
  }, 500);

  const setPage = useCallback(
    async (updates: Partial<Page>) => {
      if (!page || !mounted.current) {
        return;
      }
      debouncedPageUpdate({ id: page.id, ...updates } as Partial<Page>).catch((err: any) => {
        log.error('Error saving page', err);
      });
    },
    [page]
  );

  function updateTitle(_page: { title: string; updatedAt: any }) {
    setPage(_page);
  }

  async function publishForumPost() {
    await charmClient.forum.publishForumPost(page.post.id);
    // mutate((page) => (page ? { ...page, post: { ...page.post, status: 'published' } } : undefined), {
    //   revalidate: false
    // });
  }

  async function updateCategoryId(categoryId: string) {
    await charmClient.forum.updateForumPost(page.id, {
      categoryId
    });
    // mutate((_page) => (_page ? { ..._page, post: { ..._page?.post, categoryId } } : undefined), {
    //   revalidate: false
    // });
  }

  function updateForumPost(content: ICharmEditorOutput) {
    charmClient.forum.updateForumPost(page.id, {
      content: content.doc,
      contentText: content.rawText
    });
  }

  const readOnly = false;

  const isMyPost = page.createdBy === user?.id;

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
          onContentChange={updateForumPost}
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
          <PublishPostButton postStatus={page.post.status} onClick={publishForumPost} />
        </Box>
      )}
    </Container>
  );
}
