import type { PageContent } from 'lib/prosemirror/interfaces';

export type UpdateCommentPayload = {
  id: string;
  content: PageContent;
  contentText: string;
};
