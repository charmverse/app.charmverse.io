import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import type { PageMeta } from 'lib/pages';

type CardFields = {
  icon?: string;
  isTemplate?: boolean;
  properties: Record<string, string | string[]>;
  contentOrder: (string | string[])[];
};

export type Card = Block & {
  fields: CardFields;
};

export type CardPage = {
  card: Card;
  page: PageMeta;
};

export function createCard(block?: Partial<Block>): Card {
  const contentOrder: (string | string[])[] = [];
  const contentIds = block?.fields?.contentOrder?.filter((id: any) => id !== null);

  if (contentIds?.length > 0) {
    for (const contentId of contentIds) {
      if (typeof contentId === 'string') {
        contentOrder.push(contentId);
      } else {
        contentOrder.push(contentId.slice());
      }
    }
  }
  return {
    ...createBlock(block),
    type: 'card',
    fields: {
      icon: block?.fields?.icon || '',
      properties: { ...(block?.fields?.properties || {}) },
      contentOrder,
      isTemplate: block?.fields?.isTemplate || false,
      headerImage: block?.fields?.headerImage || null
    }
  };
}
