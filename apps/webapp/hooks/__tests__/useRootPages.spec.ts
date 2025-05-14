import { createMockPage } from '@packages/testing/mocks/page';
import { renderHook } from '@testing-library/react';
import { v4 as uuid } from 'uuid';
import { vi } from 'vitest';

import { usePages } from 'hooks/usePages';
import { useRootPages } from 'hooks/useRootPages';
import type { PagesMap } from 'lib/pages';

vi.mock('hooks/usePages', () => ({
  usePages: vi.fn()
}));

describe('useRootPages', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('should sort pages by index', () => {
    const sortedIds = [uuid(), uuid(), uuid()];
    const pages: PagesMap = {
      [uuid()]: createMockPage({ id: sortedIds[2], index: -1 }), // -1 goes last
      [uuid()]: createMockPage({ id: sortedIds[1], index: 3 }),
      [uuid()]: createMockPage({ id: sortedIds[0], index: 1 })
    };
    (usePages as vi.Mock<any, any>).mockReturnValue({
      pages
    });
    const { result } = renderHook(() => useRootPages());
    const { rootPages } = result.current;
    const rootPageIds = rootPages.map((page) => page.id);
    expect(rootPageIds).toEqual(sortedIds);
  });

  test('should filter out child pages', () => {
    const pages: PagesMap = {
      childPage: createMockPage({ parentId: uuid() }),
      cardPage: createMockPage({ type: 'card' })
    };
    (usePages as jest.Mock<any, any>).mockReturnValue({
      pages
    });
    const { result } = renderHook(() => useRootPages());
    const { rootPages } = result.current;
    expect(rootPages).toHaveLength(0);
  });
});
