import type { PageContent } from '@packages/charmeditor/interfaces';

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
