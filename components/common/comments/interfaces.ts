import type { PageContent } from 'lib/prosemirror/interfaces';

export type UpdateCommentPayload = {
  id: string;
  content: PageContent;
  contentText: string;
};

export type CreateCommentPayload = {
  content: PageContent;
  contentText: string;
  parentId?: string;
};
