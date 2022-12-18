import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';

import charmClient from 'charmClient';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor';
import { PageActions } from 'components/common/PageActions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import log from 'lib/log';
import type { PageUpdates } from 'lib/pages';
import debouncePromise from 'lib/utilities/debouncePromise';

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
  const readOnly = false;

  const isMyPost = page.createdBy === user?.id;

  return (
    <Container top={50}>
      <CharmEditor
        // content={pageDetails?.content as PageContent}
        // onContentChange={updatePageContent}
        readOnly={readOnly}
        pageActionDisplay={null}
        pageId={page.id}
        disablePageSpecificFeatures={true}
        pageType={page.type}
      >
        <PageTitleInput
          readOnly={readOnly}
          value={page.title}
          onChange={updateTitle}
          updatedAt={page.updatedAt.toString()}
        />
        <PostCategoryInput spaceId={page.spaceId} setCategoryId={updateCategoryId} categoryId={page.post.categoryId} />
      </CharmEditor>
      {isMyPost && (
        <Box display='flex' flexDirection='row' justifyContent='space-between' mb={2}>
          <PublishPostButton postStatus={page.post.status} onClick={publishForumPost} />
        </Box>
      )}
    </Container>
  );
}
