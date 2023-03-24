import type { PageType } from '@prisma/client';

export const boardPageTypes: PageType[] = ['board', 'inline_board', 'linked_board', 'inline_linked_board'];

export function isBoardPageType(type: PageType): boolean {
  return boardPageTypes.includes(type);
}
