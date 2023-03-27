import { PageType } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import { isBoardPageType } from '../isBoardPageType';

const boardPageTypes: PageType[] = ['board', 'inline_board', 'linked_board', 'inline_linked_board'];

describe('isBoardPageType', () => {
  it('should return true for boards', () => {
    for (const type of boardPageTypes) {
      expect(isBoardPageType(type)).toBe(true);
    }
  });

  it('should return false for non board', () => {
    const nonBoardPageTypes = typedKeys(PageType).filter((type) => !boardPageTypes.includes(type as PageType));

    for (const type of nonBoardPageTypes) {
      expect(isBoardPageType(type)).toBe(false);
    }
  });
});
