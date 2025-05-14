import { vi } from 'vitest';

import '@charmverse/core';

// add support for methods like .toBeInTheDocument()
import '@testing-library/jest-dom';

// import { configure } from '@testing-library/react';
// configure({
//   // Align data-test attribute with Playwright
//   testIdAttribute: 'data-test'
// });

Object.assign(globalThis, { jest: vi });

vi.mock('next/font/google', () => ({
  Source_Serif_4: () => ({
    variable: 'mocked'
  })
}));

vi.mock('next/font/local', () => ({
  default: () => ({
    variable: 'mocked'
  })
}));

// Mock external requests globally

vi.mock('@packages/blockchain/getENSName', () => ({
  ...vi.requireActual('@packages/blockchain/getENSName'),
  __esModule: true,
  getENSName: vi.fn().mockImplementation(() => Promise.resolve(null)),
  getENSDetails: vi.fn().mockImplementation(() => Promise.resolve(null)),
  resolveENSName: vi.fn().mockImplementation(() => Promise.resolve(null))
}));

vi.mock('lib/blockchain/provider/alchemy/client', () => ({
  ...vi.requireActual('lib/blockchain/provider/alchemy/client'),
  __esModule: true,
  getNFTs: jest.fn().mockImplementation(() => Promise.resolve([]))
}));

// fix dynamic imports in next.js 13: https://github.com/vercel/next.js/issues/41725
// vi.mock('next/dynamic', () => ({
//   __esModule: true,
//   default: (...props: any[]) => {
//     const dynamicModule = jest.requireActual('next/dynamic');
//     const dynamicActualComp = dynamicModule.default;
//     const RequiredComponent = dynamicActualComp(props[0]);
//     // eslint-disable-next-line no-unused-expressions
//     RequiredComponent.preload ? RequiredComponent.preload() : RequiredComponent.render.preload();
//     return RequiredComponent;
//   }
// }));

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    asPath: '/test-space',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

// Needed for prosemirror tests https://github.com/jsdom/jsdom/issues/3002
Range.prototype.getBoundingClientRect = () => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: jest.fn()
});

Range.prototype.getClientRects = () => ({
  item: () => null,
  length: 0,
  [Symbol.iterator]: jest.fn()
});
