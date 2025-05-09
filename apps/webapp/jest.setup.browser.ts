// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import { configure } from '@testing-library/react';

// @ts-ignore expose global Node.js elements to js-dom environment
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

configure({
  // Align data-test attribute with Playwright
  testIdAttribute: 'data-test'
});

// fix dynamic imports in next.js 13: https://github.com/vercel/next.js/issues/41725
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...props: any[]) => {
    const dynamicModule = jest.requireActual('next/dynamic');
    const dynamicActualComp = dynamicModule.default;
    const RequiredComponent = dynamicActualComp(props[0]);
    // eslint-disable-next-line no-unused-expressions
    RequiredComponent.preload ? RequiredComponent.preload() : RequiredComponent.render.preload();
    return RequiredComponent;
  }
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
