import { isCharmVerseSpace, defaultDomains } from '../isCharmVerseSpace';

describe('isCharmVerseSpace', () => {
  it('should return true for domains within the default allowed domains', () => {
    expect(defaultDomains.includes('charmverse')).toBe(true);
    for (const domain of defaultDomains) {
      const space = { domain };
      expect(isCharmVerseSpace({ space })).toBe(true);
    }
  });

  it('should return true for domains starting with "cvt-"', () => {
    const space = { domain: 'cvt-example' };
    expect(isCharmVerseSpace({ space })).toBe(true);
  });

  it('should return false for domains not in allowed domains and without "cvt-" prefix', () => {
    const space = { domain: 'otherdomain' };
    expect(isCharmVerseSpace({ space })).toBe(false);
  });

  it('should return false when space object is undefined', () => {
    const space = undefined;
    expect(isCharmVerseSpace({ space })).toBe(false);
  });

  // Optional: Only if the isDevEnv variable behavior is clear and testable
  it('should return true in a development environment regardless of the domain', async () => {
    // Dynamically mock the module only for this test
    jest.doMock('@packages/utils/constants', () => ({
      isDevEnv: true
    }));

    // Reset the module registry to ensure the mock is applied
    jest.resetModules();

    // Dynamically import the module after applying the mock
    const { isCharmVerseSpace: isCharmVerseSpaceMocked } = await import('../isCharmVerseSpace');

    const space = { domain: 'noncharmverse' };
    expect(isCharmVerseSpaceMocked({ space })).toBe(true);

    // Clean up: Reset the mocking after the test
    jest.resetModules();
  });
});
