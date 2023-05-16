// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

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
