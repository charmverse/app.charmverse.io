import type { PostCategory } from '@charmverse/core/prisma';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface PostDialogContext {
  postId?: string | null;
  newPost?: { category: PostCategory | null; spaceId: string };
  onClose?: () => void;
}

interface Context {
  props: PostDialogContext;
  createPost: (newPost: PostDialogContext['newPost']) => void;
  hidePost: () => void;
  showPost: (context: PostDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  props: {},
  createPost: () => {},
  hidePost: () => {},
  showPost: () => {}
});

export const usePostDialog = () => useContext(ContextElement);

export function PostDialogProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<PostDialogContext>({});

  function hidePost() {
    props?.onClose?.();
    setProps({});
  }

  function showPost(_context: PostDialogContext) {
    setProps(_context);
  }

  function createPost(newPost: PostDialogContext['newPost']) {
    setProps({ newPost });
  }

  const value = useMemo(
    () => ({
      props,
      createPost,
      hidePost,
      showPost
    }),
    [props]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
