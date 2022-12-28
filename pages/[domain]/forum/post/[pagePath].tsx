import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostPage } from 'components/forum/components/PostPage/PostPage';

export default function BlocksEditorPage() {
  const router = useRouter();
  const pagePath = router.query.pagePath as string;

  const { data, isValidating } = useSWR(`post-${pagePath}`, () => charmClient.forum.getForumPost(pagePath));

  if (!data && !isValidating) {
    return <ErrorPage message={"Sorry, that page doesn't exist"} />;
  }

  return data ? <PostPage page={data} spaceId={data.spaceId} /> : null;
}

BlocksEditorPage.getLayout = getPageLayout;
