import { useState } from 'react';

import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import type { FormInputs } from 'components/forum/components/interfaces';
import { PostPage } from 'components/forum/components/PostPage/PostPage';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';

export default function ForumPostPage() {
  const forumPostInfo = usePostByPath();

  if (forumPostInfo.error) {
    return <ErrorPage message={forumPostInfo.error.message ?? "Sorry, that page doesn't exist"} />;
  }

  return forumPostInfo.forumPost ? <WrapperPostPage post={forumPostInfo.forumPost} /> : null;
}

function WrapperPostPage({ post }: { post: PostWithVotes }) {
  const [formInputs, setFormInputs] = useState<FormInputs>(post);
  const [contentUpdated, setContentUpdated] = useState(false);
  const [, setTitleState] = usePageTitle();

  return (
    <PostPage
      formInputs={formInputs}
      setFormInputs={(_formInputs) => {
        setContentUpdated(true);
        setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
      }}
      contentUpdated={contentUpdated}
      setContentUpdated={setContentUpdated}
      post={post}
      spaceId={post.spaceId}
      onTitleChange={(newTitle) => {
        setTitleState(newTitle);
      }}
    />
  );
}

ForumPostPage.getLayout = getPageLayout;
