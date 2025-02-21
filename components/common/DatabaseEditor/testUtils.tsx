import type { PageMeta } from '@charmverse/core/pages';
import { pageStubToCreate } from '@packages/testing/generatePageStub';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { IntlProvider } from 'react-intl';
import type { Middleware } from 'redux';
import type { MockStoreEnhanced } from 'redux-mock-store';
import configureStore from 'redux-mock-store';
import { v4 } from 'uuid';

import { PagesContext } from 'hooks/usePages';
import type { UIBlockWithDetails } from 'lib/databases/block';
import { AppThemeProvider } from 'theme/AppThemeProvider';

export const wrapIntl = (children?: React.ReactNode): JSX.Element => (
  <AppThemeProvider>
    <IntlProvider locale='en'>{children}</IntlProvider>
  </AppThemeProvider>
);
export const wrapDNDIntl = (children?: React.ReactNode): JSX.Element => {
  return <DndProvider backend={HTML5Backend}>{wrapIntl(children)}</DndProvider>;
};

export const wrapPagesProvider = (cardId: string | string[], children: React.ReactNode) => {
  const pages: Record<string, PageMeta> = {};

  const cardIds = Array.isArray(cardId) ? cardId : [cardId];

  cardIds.forEach((_cardId) => {
    pages[_cardId] = pageStubToCreate({ spaceId: v4(), createdBy: v4(), id: _cardId, path: _cardId }) as PageMeta;
  });

  return (
    <PagesContext.Provider
      value={
        {
          pages
        } as any
      }
    >
      {children}
    </PagesContext.Provider>
  );
};

export function mockDOM(): void {
  window.focus = jest.fn();
  document.createRange = () => {
    const range = new Range();
    range.getBoundingClientRect = jest.fn();
    range.getClientRects = () => {
      return {
        item: () => null,
        length: 0,
        [Symbol.iterator]: jest.fn()
      };
    };
    return range;
  };
}
export function mockMatchMedia(result: { matches: boolean }): void {
  // We check if system preference is dark or light theme.
  // This is required to provide it's definition since
  // window.matchMedia doesn't exist in Jest.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => {
      return result;

      // return ({
      //     matches: true,
      // })
    })
  });
}

export function mockStateStore(middleware: Middleware[], state: unknown): MockStoreEnhanced<unknown, unknown> {
  // @ts-ignore - redux-mock-store is no longer maintained
  const mockStore = configureStore(middleware);
  return mockStore(state);
}

export type BlocksById<BlockType> = { [key: string]: BlockType };

export function blocksById<BlockType extends UIBlockWithDetails>(blocks: BlockType[]): BlocksById<BlockType> {
  return blocks.reduce((res, block) => {
    res[block.id] = block;
    return res;
  }, {} as BlocksById<BlockType>);
}
