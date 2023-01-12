import { useRouter } from 'next/router';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostPage } from 'components/forum/components/PostPage/PostPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type FormInputs = {
  title: string;
  content: any | null;
  contentText?: string;
  id?: string;
};

export default function ForumPostPage() {
  const router = useRouter();
  const pagePath = router.query.pagePath as string;
  const currentSpace = useCurrentSpace();
  const { data, isValidating } = useSWR(currentSpace ? `post-${pagePath}` : null, () =>
    charmClient.forum.getForumPost(pagePath)
  );

  const [form, setForm] = useState<FormInputs>(data ?? { title: '', content: null, contentText: '' });

  if (!data && !isValidating) {
    return <ErrorPage message={"Sorry, that page doesn't exist"} />;
  }

  return data ? <PostPage form={form} setForm={setForm} post={data} spaceId={data.spaceId} /> : null;
}

ForumPostPage.getLayout = getPageLayout;
