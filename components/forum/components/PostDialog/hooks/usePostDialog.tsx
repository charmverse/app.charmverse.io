import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface PostDialogContext {
  postId?: string | null;
  onClose?: () => void;
}

interface Context {
  props: PostDialogContext;
  hidePost: () => void;
  showPost: (context: PostDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  props: {},
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

  const value = useMemo(
    () => ({
      props,
      hidePost,
      showPost
    }),
    [props]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
